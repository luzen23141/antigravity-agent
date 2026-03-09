use crate::AppState;
use actix_web::{
    body::{EitherBody, MessageBody},
    dev::{self, Service, ServiceRequest, ServiceResponse, Transform},
    error::Error,
    error::PayloadError,
    http::header,
    web, HttpResponse,
};
use futures_util::future::LocalBoxFuture;
use futures_util::stream::once;
use futures_util::Stream;
use serde_json::{json, Value};
use std::future::{ready, Ready};
use std::pin::Pin;
use std::rc::Rc;
use std::task::{Context, Poll};

use super::is_allowed_origin;

pub const SESSION_HEADER: &str = "x-antigravity-session";

// Middleware Factory
pub struct CamelCaseToSnakeCase;

impl<S, B> Transform<S, ServiceRequest> for CamelCaseToSnakeCase
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = CamelCaseMiddleware<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(CamelCaseMiddleware {
            service: Rc::new(service),
        }))
    }
}

pub struct CamelCaseMiddleware<S> {
    service: Rc<S>,
}

impl<S, B> Service<ServiceRequest> for CamelCaseMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(&self, ctx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.service.poll_ready(ctx)
    }

    fn call(&self, mut req: ServiceRequest) -> Self::Future {
        let svc = self.service.clone();

        Box::pin(async move {
            let is_json = req
                .headers()
                .get(header::CONTENT_TYPE)
                .map(|v| v.to_str().unwrap_or("").contains("application/json"))
                .unwrap_or(false);

            if is_json {
                let body = req.extract::<web::Bytes>().await?;

                if !body.is_empty() {
                    if let Ok(mut json) = serde_json::from_slice::<Value>(&body) {
                        transform_keys(&mut json);

                        let new_body = serde_json::to_vec(&json)
                            .map_err(actix_web::error::ErrorInternalServerError)?;
                        let new_bytes = web::Bytes::from(new_body);

                        let stream = once(ready(Ok::<_, PayloadError>(new_bytes)));
                        let boxed_stream: Pin<
                            Box<dyn Stream<Item = Result<web::Bytes, PayloadError>>>,
                        > = Box::pin(stream);
                        let payload = dev::Payload::Stream {
                            payload: boxed_stream,
                        };
                        req.set_payload(payload);
                    } else {
                        let stream = once(ready(Ok::<_, PayloadError>(body)));
                        let boxed_stream: Pin<
                            Box<dyn Stream<Item = Result<web::Bytes, PayloadError>>>,
                        > = Box::pin(stream);
                        let payload = dev::Payload::Stream {
                            payload: boxed_stream,
                        };
                        req.set_payload(payload);
                    }
                }
            }

            let res = svc.call(req).await?;
            Ok(res)
        })
    }
}

pub struct RequireSessionToken;

impl<S, B> Transform<S, ServiceRequest> for RequireSessionToken
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: MessageBody + 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Transform = SessionTokenMiddleware<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(SessionTokenMiddleware {
            service: Rc::new(service),
        }))
    }
}

pub struct SessionTokenMiddleware<S> {
    service: Rc<S>,
}

impl<S, B> Service<ServiceRequest> for SessionTokenMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: MessageBody + 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(&self, ctx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.service.poll_ready(ctx)
    }

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let svc = self.service.clone();

        Box::pin(async move {
            if requires_verified_origin(req.path()) && !has_allowed_origin(&req) {
                let response = HttpResponse::Forbidden()
                    .json(json!({ "error": "Origin is not allowed" }));
                return Ok(req.into_response(response).map_into_right_body());
            }

            if req.method() == actix_web::http::Method::OPTIONS {
                let res = svc.call(req).await?.map_into_left_body();
                return Ok(res);
            }

            if requires_session_token(req.path()) {
                let Some(app_state) = req.app_data::<web::Data<AppState>>() else {
                    let response = HttpResponse::InternalServerError()
                        .json(json!({ "error": "Application state unavailable" }));
                    return Ok(req.into_response(response).map_into_right_body());
                };

                let expected_token = {
                    let state = app_state.inner.lock();
                    state.server_session_token.clone()
                };
                let provided_token = req
                    .headers()
                    .get(SESSION_HEADER)
                    .and_then(|value| value.to_str().ok());

                if provided_token != Some(expected_token.as_str()) {
                    let response = HttpResponse::Unauthorized()
                        .json(json!({ "error": "Invalid or missing session token" }));
                    return Ok(req.into_response(response).map_into_right_body());
                }
            }

            let res = svc.call(req).await?.map_into_left_body();
            Ok(res)
        })
    }
}

fn requires_verified_origin(path: &str) -> bool {
    path == "/api/get_server_session_token" || requires_session_token(path)
}

fn has_allowed_origin(req: &ServiceRequest) -> bool {
    let Some(origin) = req
        .headers()
        .get(header::ORIGIN)
        .and_then(|value| value.to_str().ok())
    else {
        return true;
    };

    is_allowed_origin(origin)
}

fn requires_session_token(path: &str) -> bool {
    matches!(
        path,
        "/api/get_antigravity_accounts"
            | "/api/get_current_antigravity_account_info"
            | "/api/collect_account_contents"
            | "/api/save_antigravity_current_account"
            | "/api/restore_antigravity_account"
            | "/api/switch_to_antigravity_account"
            | "/api/clear_all_antigravity_data"
            | "/api/sign_in_new_antigravity_account"
            | "/api/get_account_metrics"
            | "/api/trigger_quota_refresh"
            | "/api/restore_backup_files"
            | "/api/delete_backup"
            | "/api/clear_all_backups"
            | "/api/save_system_tray_state"
            | "/api/save_silent_start_state"
            | "/api/save_private_mode_state"
            | "/api/save_debug_mode_state"
            | "/api/set_language"
            | "/api/save_antigravity_executable"
            | "/api/update_tray_menu_command"
            | "/api/minimize_to_tray"
            | "/api/restore_from_tray"
            | "/api/start_database_monitoring"
            | "/api/stop_database_monitoring"
            | "/api/write_text_file"
            | "/api/open_log_directory"
            | "/api/launch_and_install_extension"
    )
}

/// Recursively transform keys from camelCase to snake_case
fn transform_keys(value: &mut Value) {
    match value {
        Value::Object(map) => {
            let original_keys: Vec<String> = map.keys().cloned().collect();
            let mut new_map = serde_json::Map::new();

            for key in original_keys {
                if let Some(mut val) = map.remove(&key) {
                    transform_keys(&mut val);
                    let new_key = camel_to_snake(&key);
                    new_map.insert(new_key, val);
                }
            }
            *map = new_map;
        }
        Value::Array(arr) => {
            for val in arr {
                transform_keys(val);
            }
        }
        _ => {}
    }
}

fn camel_to_snake(s: &str) -> String {
    let mut new_s = String::new();
    for (i, c) in s.char_indices() {
        if c.is_uppercase() {
            if i != 0 {
                new_s.push('_');
            }
            new_s.extend(c.to_lowercase());
        } else {
            new_s.push(c);
        }
    }
    new_s
}
