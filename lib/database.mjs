import Knex from "knex";

export class Database {
  #version = 5;
  #initialized = false;

  #knex = Knex({
    client: "better-sqlite3",
    connection: { filename: `./db.v${this.#version}.sqlite` },
  });

  constructor() {
    // this.#knex.on("query", (query) => console.log(`[DB] ${query.sql}`));
  }

  /**
   * @param {string} name
   * @param {string} mbid
   * @returns
   */
  async addArtist(name, mbid) {
    if (!this.#initialized) await this.#initializeDatabase();

    return await this.#knex.table("artists").insert({ name, id: mbid });
  }

  async getArtists() {
    if (!this.#initialized) await this.#initializeDatabase();

    return await this.#knex.table("artists").select("*");
  }

  /**
   * @param {string} name
   */
  async hasArtistName(name) {
    if (!this.#initialized) await this.#initializeDatabase();

    const artist = await this.#knex.table("artists").select("*").where({ name }).first();

    return artist;
  }

  /**
   * @param {string} id
   */
  async hasArtistId(id) {
    if (!this.#initialized) await this.#initializeDatabase();

    const artist = await this.#knex.table("artists").select("id").where({ id }).first();

    return !!artist;
  }

  /**
   * @param {string} filepath
   * @param {string} artistId
   * @returns
   */
  async addTrack(filepath, artistId) {
    if (!this.#initialized) await this.#initializeDatabase();

    return await this.#knex.table("tracks").insert({ filepath, artistId });
  }

  /**
   * @param {string} filepath
   * @returns
   */
  async hasTrack(filepath) {
    if (!this.#initialized) await this.#initializeDatabase();

    const row = await this.#knex.table("tracks").select("filepath").where({ filepath }).first();

    return !!row;
  }

  /**
   * @param {string} url
   * @param {string} response
   */
  async addApiCache(url, response) {
    if (!this.#initialized) await this.#initializeDatabase();

    return await this.#knex.table("api_cache").insert({ url, response });
  }

  /**
   * @param {string} url
   * @returns {Promise<string | undefined>}
   */
  async getApiCache(url) {
    if (!this.#initialized) await this.#initializeDatabase();

    const row = await this.#knex.table("api_cache").where({ url }).select("response").first();

    return row?.["response"];
  }

  /**
   * @param {string} fromArtistId
   * @param {string} toArtistId
   * @param {number} score
   */
  async addSimilarArtist(fromArtistId, toArtistId, score) {
    if (!this.#initialized) await this.#initializeDatabase();

    return await this.#knex.table("similar_artists").insert({ fromArtistId, toArtistId, score });
  }

  async #initializeDatabase() {
    if (this.#initialized) return;

    if (!(await this.#knex.schema.hasTable("artists"))) {
      await this.#knex.schema.createTable("artists", (table) => {
        table.uuid("id").defaultTo(this.#knex.fn.uuid());
        table.string("name").notNullable().unique();
      });
    }

    if (!(await this.#knex.schema.hasTable("tracks"))) {
      await this.#knex.schema.createTable("tracks", (table) => {
        table.uuid("artistId").defaultTo(this.#knex.fn.uuid());
        table.string("filepath").notNullable().unique();
      });
    }

    if (!(await this.#knex.schema.hasTable("api_cache"))) {
      await this.#knex.schema.createTable("api_cache", (table) => {
        table.string("url").notNullable();
        table.string("response").notNullable();
      });
    }

    if (!(await this.#knex.schema.hasTable("similar_artists"))) {
      await this.#knex.schema.createTable("similar_artists", (table) => {
        table.uuid("fromArtistId").notNullable();
        table.uuid("toArtistId").notNullable();
        table.integer("score").notNullable();
      });
    }

    this.#initialized = true;
  }

  async close() {
    await this.#knex.destroy();
  }
}
