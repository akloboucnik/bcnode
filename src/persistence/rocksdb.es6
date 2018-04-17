/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type { Logger } from 'winston'
const process = require('process')
const RocksDb = require('rocksdb-node')

const { getLogger } = require('../logger/index')
const { serialize, deserialize } = require('./codec')

/**
 * Unified persistence interface
 */
export default class PersistenceRocksDb {
  _location: string; // eslint-disable-line no-undef
  _logger: Logger; // eslint-disable-line no-undef
  _db: ?RocksDb; // eslint-disable-line no-undef
  _isOpen: boolean; // eslint-disable-line no-undef

  constructor (location: string = '_data') {
    this._location = location
    this._logger = getLogger(__filename)
    this._isOpen = false
  }

  get db (): RocksDb {
    return this._db
  }

  get isOpen (): boolean {
    return this._isOpen
  }

  /**
   * Open database
   * @param opts
   */
  open (opts: Object = { create_if_missing: true }) {
    try {
      this._db = RocksDb.open(opts, this._location)
      this._isOpen = true
      this._logger.debug(`Successfuly opened rocksDb in location ${this._location}`)
    } catch (e) {
      this._logger.error(`Cannot open rocksDb in location ${this._location}`)
      process.exit(2)
    }
  }

  /**
   * Close database
   */
  close (): Promise<*> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          return reject(err)
        }

        resolve(true)
      })
    })
  }

  /**
   * Put data into database
   * @param key
   * @param value
   * @param opts
   */
  put (key: string, value: any, opts: Object = {}): Promise<*> {
    const serialized = serialize(value)
    this.db.put({ sync: true }, key, serialized)
    // return new Promise((resolve, reject) => {
    //   this.db.put(key, serialized, (err) => {
    //     if (err) {
    //       return reject(err)
    //     }
    //
    //     return resolve(true)
    //   })
    // })
  }

  /**
   * Get data from database
   * @param key
   * @param opts
   */
  get (key: string, opts: Object = { buffer: true }): ?Object|Error {
    const value = this.db.get(opts, key)
    if (value === null) {
      return null
    }
    const deserialized = deserialize(value)
    return deserialized
    // return new Promise((resolve, reject) => {
    //   this.db.get(opts, key, (err, value) => {
    //     if (err) {
    //       return reject(new Error(`${err.message} - ${key}`))
    //     }
    //     try {
    //       const deserialized = deserialize(value)
    //       return resolve(deserialized)
    //     } catch (e) {
    //       const {inspect} = require('util')
    //       return reject(new Error(`Could not deserialize value, key ${key}, ${inspect(value)}`))
    //     }
    //   })
    // })
  }

  /**
   * Delete data from database
   * @param key
   * @param opts
   */
  del (key: string, opts: Object = {}): Promise<*> {
    return new Promise((resolve, reject) => {
      this.db.del(key, opts, (err) => {
        if (err) {
          return reject(err)
        }

        resolve(true)
      })
    })
  }
}
