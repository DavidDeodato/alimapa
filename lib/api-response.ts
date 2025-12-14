import { NextResponse } from "next/server"

export type OkResponse<T> = { ok: true; data: T }
export type ErrResponse = { ok: false; error: string }

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data } satisfies OkResponse<T>, init)
}

export function err(error: string, status = 400) {
  return NextResponse.json({ ok: false, error } satisfies ErrResponse, { status })
}


