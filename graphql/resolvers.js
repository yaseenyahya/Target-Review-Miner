var db = require("../models/index");

var { AuthenticationError } = require("apollo-server");
const { Op, col, fn } = require("sequelize");
const resolveFuntions = require("./resolveFuntions");
const _ = require('lodash');

const env = process.env.NODE_ENV || "development";




module.exports = {
  
  Query: {

    get_datas: async (parent, args, { res, resolver }) => {
      const designations = await db.designations.findAll({
        order: [["id", "DESC"]],
      });

      return designations;
    },
   
    get_datas_by_id: async (parent, args) => {
      

      return {
        currentDateTime: "asd",
        folderId: args.folderId,
        searchText: args.searchText,
        startDate: args.startDate,
        endDate: args.endDate,
        files: filteredResults
      }
    },
   

  },
  
  
};
