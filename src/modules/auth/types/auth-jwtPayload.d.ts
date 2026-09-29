export type AuthJwtPayload = {
  sub: string;
  realm?: string;
  /** Present only on a client-credentials (service-account) token — the
   * OAuth2 client_id that requested it, for traceability/audit. Absent on
   * ordinary user-login tokens. */
  client_id?: string;
};
