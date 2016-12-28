
declare module "memcached" {
    interface MemcachedStoreOptions {
        maxKeySize?: number
        maxExpiration?: number
        maxValue?: number
        poolSize?: number
        algorithm?: string
        reconnect?: number
        timeout?: number
        retries?: number
        failures?: number
        retry?: number
        remove?: boolean
        failOverServers?: undefined | string | Array<string> | Array<MemcahcedServerLocationsOptions>
        keyCompression?: boolean
        idle?: number
    }

    interface MemcahcedServerLocationsOptions {
        [server: string]: number
    }

    namespace Memcached { }
    class Memcached {
        constructor(server: string | Array<string> | Array<MemcahcedServerLocationsOptions>, options?: MemcachedStoreOptions)

        touch: (key: string, lifetime: number, callback?: (err: Error) => void) => void
        get: (key: string, callback?: (err: Error, data: any) => void) => void
        set: (key: string, value: any, lifetime: number, callback?: (err: Error) => void) => void
    }

    export = Memcached
}
