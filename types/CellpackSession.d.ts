/// <reference types="bluebird" />
import * as Promise from "bluebird";
import { Cellpack, Connection } from "microb";
export default class CellpackSession extends Cellpack {
    private store;
    init(): Promise<void>;
    private initStore();
    request(connection: Connection): Promise<boolean>;
}
