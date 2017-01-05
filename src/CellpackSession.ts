import * as Lodash from "lodash"
import * as Promise from "bluebird"
import * as Uid from "uid-safe"
import * as Moment from "moment"
//
import { Cellpack, Connection, Session, Cookie } from "microb"
//
import * as Memcached from "memcached"

export default class CellpackSession extends Cellpack {

    private store: any
    private sid: string

    init(){
        this.config = this.environment.get("cellpacks")["cellpack-session"]
        // connection to store
        if(!Lodash.isUndefined(this.config.store)){
            // todo types
            this.initStore()
        }
        return Promise.resolve()
    }

    private initStore(){
        this.store = new Memcached(`${this.config.store.options.server}:${this.config.store.options.port}`,{
            timeout: 15000,
            idle: 30000
        })
    }

    getSession(connection: Connection, name: string): Promise<Session> {
        name = (Lodash.isUndefined(name) ? this.config.name : `${this.config.name}_${name}`)
        if(connection.request.cookies.has(name)){
            let sessionCookie = connection.request.cookies.get(name)
            this.sid = sessionCookie
            if(Lodash.isUndefined(this.store)) this.initStore() // TODO: promise?
            return new Promise<Session>((resolve, reject) => {
                this.store.get(sessionCookie, (err: any, data: any) => {
                    if(err) return reject(err)
                    else {
                        if(!Lodash.isUndefined(data)){
                            let session = (new Session(data.params))
                            .setExpires(data.expires)
                            .setPath(data.path)
                            .setDomain(data.domain)
                            .setSecure(data.secure)
                            .setHttponly(data.httponly)

                            let exp = session.getExpiresUnix() || this.config.expires
                            this.store.touch(sessionCookie,exp,(err: Error) => {
                                this.setSessionCookie(sessionCookie,connection,session)
                                return resolve(session)
                            })
                        } else return resolve(new Session())
                    }
                })
            })
        } else return Promise.resolve<Session>(new Session())
    }

    setSession(connection: Connection, session: Session): Promise<Session> {
        return new Promise((resolve,reject) => {
            if(!connection.request.cookies.has(this.config.name)){
                this.generateSid().then((sid) => {
                    this.setSessionCookie(sid,connection,session)
                    resolve(sid)
                })
            } else return resolve(connection.request.cookies.get(this.config.name))
        }).then((sid) => {
            if(Lodash.isUndefined(this.store)) this.initStore()
            return new Promise<Session>((resolve,reject) => {
                let exp = session.getExpiresUnix() || this.config.expires
                this.store.set(sid,session,exp,(err: Error) => {
                    if(err !== undefined){
                        this.transmitter.emit("log.cellpack.session",`\tError in setSession(): ${err}`)
                        reject(err)
                    } else resolve(session)
                })
            })
        })
    }

    private setSessionCookie(sid: string, connection: Connection, session: Session){
        if(this.environment.get("debug")) this.transmitter.emit("log.cellpack.session",`Set session cookie: ${sid}`)
        let domain = session.getDomain()
        if(Lodash.isArray(domain)){
            (<Array<string>>domain).forEach((dom: string, index: number, arr: Array<string>) => {
                connection.response.setCookie(new Cookie(
                    this.config.name,
                    sid,
                    session.getExpires() || this.config.expires,
                    session.getPath() || "/",
                    dom || "",
                    session.isSecure() || false,
                    session.isHttponly() || true
                ))
            })
        } else {
            connection.response.setCookie(new Cookie(
                this.config.name,
                sid,
                session.getExpires() || this.config.expires,
                session.getPath() || "/",
                domain || "/",
                session.isSecure() || false,
                session.isHttponly() || true
            ))
        }
    }

    getSid(): string {
        return this.sid
    }

    generateSid(): Promise<string> {
        return new Promise<string>((resolve,reject) => {
            Uid(24).then((uid) => {
                this.sid = uid
                resolve(uid)
            })
        })
    }
}
