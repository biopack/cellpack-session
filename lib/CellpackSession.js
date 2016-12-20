"use strict";
const Lodash = require("lodash");
const Promise = require("bluebird");
const microb_1 = require("microb");
const Memcached = require("memcached");
class CellpackSession extends microb_1.Cellpack {
    init() {
        this.config = this.environment.get("cellpacks")["cellpack-restify"];
        if (!Lodash.isUndefined(this.config.store)) {
            this.initStore();
        }
        return Promise.resolve();
    }
    initStore() {
        this.store = new Memcached(this.config.store.options.server);
    }
    request(connection) {
        if (connection.request.cookies.has(this.config.name)) {
            let session_cookie = connection.request.cookies.get(this.config.name);
            if (Lodash.isUndefined(this.store))
                this.initStore();
            return new Promise((resolve, reject) => {
                this.store.touch(session_cookie, this.config.expires);
                this.store.get(session_cookie, (err, data) => {
                    connection.environment.set('session', data);
                    return resolve(true);
                });
            });
        }
        else
            return Promise.resolve(true);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CellpackSession;
