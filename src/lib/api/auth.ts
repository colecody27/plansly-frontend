import { PUBLIC_API_BASE_URL } from '$env/static/public';

export const getLoginUrl = () => `${PUBLIC_API_BASE_URL}/auth/login`;
