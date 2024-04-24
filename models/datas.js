"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Datas extends Model {
    static associate(models) {
     
    }
  }
  Datas.init(
    {
      preview: DataTypes.TEXT("long"),
      filename: DataTypes.STRING,
      extension: DataTypes.STRING,
      transcription: DataTypes.TEXT("long"),
      folderId: DataTypes.INTEGER,
      moreInfo:DataTypes.STRING,
      deleted: DataTypes.BOOLEAN,
      createdAt:DataTypes.DATE,
      size: DataTypes.INTEGER,
    },
    {
      sequelize,
      hooks: {
        beforeBulkCreate: function (files, options) {      
          files.forEach((file) => {

          

          });
        },
        beforeCreate: function (file, options) {
        
 
        },
        beforeUpdate: function (file, options) {

        
          
        },
      },
      modelName: "datas",
      timestamps:false
    }
  );
  return Datas;
};
