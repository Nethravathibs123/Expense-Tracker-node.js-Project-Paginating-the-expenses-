const sequelize=require('../util/database')
const Sequelize=require('sequelize')

const downloadhistory=sequelize.define('downloadhistory',{
id:{
    type:Sequelize.INTEGER,
    autoIncrement:true,
    allowNull:false,
    primaryKey:true
},
link:{
    type:Sequelize.STRING,
    unique:true
}

})

module.exports=downloadhistory;