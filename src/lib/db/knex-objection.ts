import knex from "knex";
import { Model } from "objection";

const knexConfig = require("../../../knexfile.cjs");

const db = knex(knexConfig.development);

Model.knex(db);

export default Model;
