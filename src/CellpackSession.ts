import * as Lodash from "lodash"
import * as Promise from "bluebird"
//
import { Cellpack, Connection } from "microb"
//
import * as Memcached from "memcached"

export default class CellpackSession extends Cellpack {

    private store: any

    init(){
        this.config = this.environment.get("cellpacks")["cellpack-restify"]
        // connection to store
        if(!Lodash.isUndefined(this.config.store)){
            // todo types
            this.initStore()
        }

        return Promise.resolve()
    }

    private initStore(){
        this.store = new Memcached(this.config.store.options.server)
    }

    request(connection: Connection){
        if(connection.request.cookies.has(this.config.name)){
            let session_cookie = connection.request.cookies.get(this.config.name)

            if(Lodash.isUndefined(this.store)) this.initStore() // TODO: promise

            return new Promise<boolean>((resolve, reject) => {
                this.store.touch(session_cookie, this.config.expires)
                this.store.get(session_cookie, (err: any, data: any) => {

                    connection.environment.set('session', data)

                    return resolve(true)
                })
            })
        } else return Promise.resolve(true)
    }
}
