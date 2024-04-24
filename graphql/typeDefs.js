var { gql } = require("apollo-server-express");
module.exports = gql`


type Datas {
  id: ID
  preview: String
  filename: String!
  extension: String
  truncatedTranscriptionText:String
  moreInfo: String
  deleted: Boolean
  size:Int
}
  type Query {
    get_datas: [Datas]
    
    get_datas_by_id(id: String!):Datas
   
  }


`;
