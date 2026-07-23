from backend.infrastructure.services.oauth_service import (
    JWT_SECRET,
    ALGORITHM,
    GOOGLE_CLIENT_ID,
    security,
    create_jwt_token,
    get_current_user,
    get_current_user_optional,
    close_auth_client,
    verify_google_id_token
)
