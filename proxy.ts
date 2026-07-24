import { NextRequest, NextResponse } from 'next/server';

const ANON_ID_COOKIE = 'anon_id';
const ONE_YEAR = 60 * 60 * 24 * 365;

export function proxy(request: NextRequest) {
    if (request.cookies.get(ANON_ID_COOKIE)?.value) {
        return NextResponse.next();
    }

    const anonId = crypto.randomUUID();

    const requestHeaders = new Headers(request.headers);
    const existingCookie = requestHeaders.get('cookie');
    requestHeaders.set(
        'cookie',
        existingCookie ? `${existingCookie}; ${ANON_ID_COOKIE}=${anonId}` : `${ANON_ID_COOKIE}=${anonId}`
    );

    const response = NextResponse.next({
        request: { headers: requestHeaders },
    });
    response.cookies.set(ANON_ID_COOKIE, anonId, {
        maxAge: ONE_YEAR,
        path: '/',
        sameSite: 'lax',
    });
    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|assets).*)',
    ],
};
