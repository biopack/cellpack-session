"use strict";
const Lodash = require("lodash");
const Promise = require("bluebird");
const Uid = require("uid-safe");
const microb_1 = require("microb");
const Memcached = require("memcached");
class CellpackSession extends microb_1.Cellpack {
    init() {
        this.config = this.environment.get("cellpacks")["cellpack-session"];
        if (!Lodash.isUndefined(this.config.store)) {
            this.initStore();
        }
        return Promise.resolve();
    }
    initStore() {
        this.store = new Memcached(`${this.config.store.options.server}:${this.config.store.options.port}`, {
            timeout: 15000,
            idle: 30000
        });
    }
    getSession(connection, name) {
        name = (Lodash.isUndefined(name) ? this.config.name : `${this.config.name}_${name}`);
        if (connection.request.cookies.has(name)) {
            let sessionCookie = connection.request.cookies.get(name);
            this.sid = sessionCookie;
            if (Lodash.isUndefined(this.store))
                this.initStore();
            return new Promise((resolve, reject) => {
                this.store.get(sessionCookie, (err, data) => {
                    if (err)
                        return reject(err);
                    else {
                        if (!Lodash.isUndefined(data)) {
                            let session = (new microb_1.Session(data.params))
                                .setExpires(data.expires)
                                .setPath(data.path)
                                .setDomain(data.domain)
                                .setSecure(data.secure)
                                .setHttponly(data.httponly);
                            let exp = session.getExpiresUnix() || this.config.expires;
                            this.store.touch(sessionCookie, exp, (err) => {
                                this.setSessionCookie(sessionCookie, connection, session);
                                return resolve(session);
                            });
                        }
                        else
                            return resolve(new microb_1.Session());
                    }
                });
            });
        }
        else
            return Promise.resolve(new microb_1.Session());
    }
    setSession(connection, session) {
        return new Promise((resolve, reject) => {
            if (!connection.request.cookies.has(this.config.name)) {
                this.generateSid().then((sid) => {
                    this.setSessionCookie(sid, connection, session);
                    resolve(sid);
                });
            }
            else
                return resolve(connection.request.cookies.get(this.config.name));
        }).then((sid) => {
            if (Lodash.isUndefined(this.store))
                this.initStore();
            return new Promise((resolve, reject) => {
                let exp = session.getExpiresUnix() || this.config.expires;
                this.store.set(sid, session, exp, (err) => {
                    if (err !== undefined) {
                        this.transmitter.emit("log.cellpack.session", `\tError in setSession(): ${err}`);
                        reject(err);
                    }
                    else
                        resolve(session);
                });
            });
        });
    }
    setSessionCookie(sid, connection, session) {
        if (this.environment.get("debug"))
            this.transmitter.emit("log.cellpack.session", `Set session cookie: ${sid}`);
        let domain = session.getDomain();
        if (Lodash.isArray(domain)) {
            domain.forEach((dom, index, arr) => {
                connection.response.setCookie(new microb_1.Cookie(this.config.name, sid, session.getExpires() || this.config.expires, session.getPath() || "/", dom || "", session.isSecure() || false, session.isHttponly() || true));
            });
        }
        else {
            connection.response.setCookie(new microb_1.Cookie(this.config.name, sid, session.getExpires() || this.config.expires, session.getPath() || "/", domain || "/", session.isSecure() || false, session.isHttponly() || true));
        }
    }
    getSid() {
        return this.sid;
    }
    generateSid() {
        return new Promise((resolve, reject) => {
            Uid(24).then((uid) => {
                this.sid = uid;
                resolve(uid);
            });
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CellpackSession;
