/// <reference types="bluebird" />
import * as Promise from "bluebird";
import { Cellpack, Connection, Session } from "microb";
export default class CellpackSession extends Cellpack {
    private store;
    private sid;
    init(): Promise<void>;
    private initStore();
    getSession(connection: Connection, name: string): Promise<Session>;
    setSession(connection: Connection, session: Session): Promise<Session>;
    private setSessionCookie(sid, connection, session);
    getSid(): string;
    generateSid(): Promise<string>;
}
