// server

var express = require('express'),
    app = express();
var hypermedia = require('hypermedia');
var HypermediaType = require('hypermedia-type');
var uuid = require('node-uuid');
var mysql = require('mysql');
var request_client = require('request');
var Client = require('node-rest-client').Client;
var http = require('http');


/////////////////////////////////////////////////////////////////////////paremeters of Local Database.
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'xyz12345',
  database : 'fis_assignment_5'
});
/////////////////////////////////////////////////////////////////////////paremeters of Local Database.



//////////////////////////////////////////////////////////////////////////SQL commands to be executed here.
function setRequestedData(sql,post,callback){
	
		connection.query(sql, post, function(err, result) {
			  if(err){
					callback(err);
					//throw err;
					//return;	
				} 
				
				callback(null,result);
		});
	
}

function getRequestedData(sql,callback){
	
	connection.query(sql,function(err,rows,fields){
  if(err){
		callback(err);
		//throw err;
		return;	
  } 
	callback(null,rows,fields);
  
});
	
}
//////////////////////////////////////////////////////////////////////////SQL commands to be executed here.


/////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////This function is used to generate URI's for different operations///////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////
function get_uri(name,title,operation,fields,category_item,insertedId,show_all){
	
var uri;
if(insertedId==null){
	uri = 'http://localhost:8000/warehouse/'+category_item;	
}
else if(show_all){
	uri = 'http://localhost:8000/warehouse/'+category_item;
}
else{
	
	uri = 'http://localhost:8000/warehouse/'+category_item+'/'+ insertedId;
}

var return_uri = {
		  "name": name,
		  "title": title,
		  "method": operation,
		  "href": uri,
		  "type": "application/x-www-form-urlencoded",
		  "fields": fields
				};
				
return 	return_uri;			
	
}

//////////////////we are executing the control Recipe.
function executeCTRL(id_cntrl,id_products){
	
	//http://localhost:2999/control-recipes/ControlRec-a12fe023-3e54-42a6-b07c-40576e410b90?action=start


	//var myUrl = 'http://localhost:2999/control-recipes';
	var myUrl = 'http://localhost:2999/control-recipes/'+id_cntrl;
///////////////////////////////////////////////////////////////////////////////////////////////////////////									
  var options = {
	  url:myUrl,
    //url: 'http://localhost:2999/control-recipes',
    method: "POST",
    qs:{"action":"start"}	
  }
  
  console.log(JSON.stringify(options));

  request_client(options , function(error, response, body){
      if(error) {
          console.log(error);
      } else {
          console.log(response.statusCode, body);
		  
      }
    });
///////////////////////////////////////////////////////////////////////////////////////////////////////////	
	
	
}

//////////////////we are generating control Recipe.
function executeMain( id_master,id_products){
	
//http://localhost:2999/control-recipes/ControlRec-a12fe023-3e54-42a6-b07c-40576e410b90?action=start
	var id_cntrl;
	var myUrl = 'http://localhost:2999/control-recipes';
///////////////////////////////////////////////////////////////////////////////////////////////////////////									
  var options = {
	  url:myUrl,
    //url: 'http://localhost:2999/control-recipes',
	qs:{fromMaster:id_master},
    method: "POST",
    json: { "baseUrl": "http://localhost:3000","poid":id_products} 
  }
  


  //console.log(JSON.stringify(options));

  request_client(options , function(error, response, body){
      if(error) {
          console.log(error);
      } else {
          //console.log("FROM CONTROLLER");	
	   //console.log(body["data"]);
          //console.log(JSON.parse(body));
		  //id_cntrl =  JSON.parse(body).hypermedia.start.url;
		  id_cntrl =  body["data"];
		  executeCTRL( id_cntrl,id_products);
      }
    });
///////////////////////////////////////////////////////////////////////////////////////////////////////////	
	
	
}


//////////////////we are generating master Recipe.
function sendToScada( id_products,kb,sc,fr){
	
	var myRequest = {
		
		frame: fr,
		screen: sc,
		keyboard: kb,
		poid:id_products
	};
	
	var id_master;
	var myUrl = 'http://localhost:2999/master-recipes/';
///////////////////////////////////////////////////////////////////////////////////////////////////////////									
  var options = {
	  url:myUrl,
    //url: 'http://localhost:8080/warehouse/purchaseOrder',
	//qs:{materialName:kb,quantity:required_kb,POId:id_products},
    method: "POST",
	//json: {frame: "frame1",screen: "screen3",keyboard: "keyboard1"}
	  json: myRequest
    	
  }
  
  //console.log(JSON.stringify(options));

  request_client(options , function(error, response, body){
      if(error) {
          console.log(error);
      } else {
          //console.log(response.statusCode, body);
		  //console.log(body.url);
		  id_master =  body.url;
		  executeMain( id_master,id_products);
		  //http://localhost:2999/control-recipes?fromMaster=MasterRec-e96fac8d-fef5-4a20-a6f5-ea4e6cb0f6eb
		  
      }
    });
///////////////////////////////////////////////////////////////////////////////////////////////////////////	
	
	
	
	
	
}



function reserveMaterials( id_products, recipe, quantity){
	
//	console.log('recipe');	
//	console.log(recipe);
	total_q = quantity;

//////////////////////////////////////////////////	
	var kb = recipe.keyboard;
	var sc = recipe.screen;
	var fr = recipe.frame;
//////////////////////////////////////////////////	
	var pc = recipe.phondeCost;
	
	var kb_q;
	var sc_q;
	var fr_q;
	
	var required_kb=0;
	var required_sc=0;	
	var required_fr=0;
	
	
var sql_ordered = "SELECT currentStock, materialName FROM warehousestock WHERE materialName='" + kb + "' OR materialName='" + sc +  "' OR materialName='" + fr +"'";
//console.log(sql_ordered);

	  //var sql_ordered = "SELECT *FROM "+type;
	getRequestedData(sql_ordered,function(err, rows, fields){
			if (err) {
				console.log('Error: ' + err);
				return;
			}
			
	//console.log('quantity');		

//////////////////////////////////////////////////////This loop checks whether there are enough matrials to start processing or should the materials be ordered.	
			for(var i=0;i<rows.length;i++){
				
				if(rows[i].materialName==kb){
					kb_q=rows[i].currentStock;
					required_kb = rows[i].currentStock - quantity;
					
				}
				else if(rows[i].materialName==sc){
					sc_q=rows[i].currentStock;
					required_sc = rows[i].currentStock - quantity;
					
				}
				else if(rows[i].materialName==fr){
					fr_q=rows[i].currentStock;
					required_fr = rows[i].currentStock - quantity;
					
				}				

				
				//console.log(rows[i]);

			}

//////////////////////////////////////////////////////
			
if(required_kb<0){

	required_kb = -required_kb;	
	console.log("Sending request to order "+required_kb+" "+kb);
//localhost:8080/warehouse/purchaseOrder?materialName=kbd3&quantity=4&POId=195da56e-034c-4cf9-92d7-6170818d10ad
//http://localhost:8000/warehouse	
	//required_kb = -required_kb;
	//console.log("required keyboards:");
	//console.log(required_kb);
	var myUrl = 'http://localhost:9000/erp/purchaseOrder?materialName='+kb+'&quantity='+required_kb+'&POId='+id_products;
///////////////////////////////////////////////////////////////////////////////////////////////////////////									
  var options = {
	  url:myUrl,
    //url: 'http://localhost:8080/warehouse/purchaseOrder',
	//qs:{materialName:kb,quantity:required_kb,POId:id_products},
    method: "POST"
  }
  
  console.log(JSON.stringify(options));

  request_client(options , function(error, response, body){
      if(error) {
          console.log(error);
      } else {
          console.log("Products are ordered from ERP, and they are reserved. Processing can start now");

		var	sqlQuery = "update warehousestock set currentStock = currentStock - ? where materialName = ?";
		var update = [
			quantity,
			kb
		];
		setRequestedData(sqlQuery, update, function (err, results) {
			if (err) console.log(err);
			
		});


	  }
    });
///////////////////////////////////////////////////////////////////////////////////////////////////////////				
	
	
}
else{
	
		var	sqlQuery = "update warehousestock set currentStock = currentStock - ? where materialName = ?";
		var update = [
			quantity,
			kb
		];
		setRequestedData(sqlQuery, update, function (err, results) {
			if (err) console.log(err);
			
		});
	
	
}
	

if(required_sc<0){

	required_sc = -required_sc;	
	console.log("Sending request to order "+required_sc+" "+sc);
	
	//required_sc = -required_sc;
	//console.log("required screens:");
	//console.log(required_sc);
	var myUrl = 'http://localhost:9000/erp/purchaseOrder?materialName='+sc+'&quantity='+required_sc+'&POId='+id_products;
///////////////////////////////////////////////////////////////////////////////////////////////////////////									
  var options = {
	  url:myUrl,
    //url: 'http://localhost:8080/warehouse/purchaseOrder',
	//qs:{materialName:kb,quantity:required_kb,POId:id_products},
    method: "POST"
  }
  
  console.log(JSON.stringify(options));

  request_client(options , function(error, response, body){
      if(error) {
          console.log(error);
      } else {
          //console.log(response.statusCode, body);
          console.log("Products are ordered from ERP, and they are reserved. Processing can start now");

		var	sqlQuery = "update warehousestock set currentStock = currentStock - ? where materialName = ?";
		var update = [
			quantity,
			sc
		];
		setRequestedData(sqlQuery, update, function (err, results) {
			if (err) console.log(err);
			
		});		  	  
		  
      }
    });
///////////////////////////////////////////////////////////////////////////////////////////////////////////				
	
	
}
else{
	
		var	sqlQuery = "update warehousestock set currentStock = currentStock - ? where materialName = ?";
		var update = [
			quantity,
			sc
		];
		setRequestedData(sqlQuery, update, function (err, results) {
			if (err) console.log(err);
			
		});
	
	
}



if(required_fr<0){
	
			required_fr = -required_fr;
	console.log("Sending request to order "+required_fr+" "+fr);			
	//console.log("required frames:");
	//console.log(required_fr);
	
	var myUrl = 'http://localhost:9000/erp/purchaseOrder?materialName='+fr+'&quantity='+required_fr+'&POId='+id_products;
///////////////////////////////////////////////////////////////////////////////////////////////////////////									
  var options = {
	  url:myUrl,
    //url: 'http://localhost:8080/warehouse/purchaseOrder',
	//qs:{materialName:kb,quantity:required_kb,POId:id_products},
    method: "POST"
  }
  
  console.log(JSON.stringify(options));

  request_client(options , function(error, response, body){
      if(error) {
          console.log(error);
      } else {
          //console.log(response.statusCode, body);
          console.log("Products are ordered from ERP, and they are reserved. Processing can start now");

		var	sqlQuery = "update warehousestock set currentStock = currentStock - ? where materialName = ?";
		var update = [
			quantity,
			fr
		];
		setRequestedData(sqlQuery, update, function (err, results) {
			if (err) console.log(err);
			
		});		  
		  
      }
    });
///////////////////////////////////////////////////////////////////////////////////////////////////////////				
	
	
}
else{
	
		var	sqlQuery = "update warehousestock set currentStock = currentStock - ? where materialName = ?";
		var update = [
			quantity,
			fr
		];
		setRequestedData(sqlQuery, update, function (err, results) {
			if (err) console.log(err);
			
		});
	
	
}



sendToScada(id_products,kb,sc,fr);
	
	

	});	  
 	
	
	
}



/////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////This function is used to generate URI's for different operations///////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////

//var materialsController = require('./warehouse.js').materialsController;
//var warehouseController = require('./warehouse.js').warehouseController;


var warehouseView = {
  materials : "/warehouse/materials",
  products : "/warehouse/products"
};

//This would be sent from SCADA on completion of the product from the factory floor.
app.post('/warehouse/notifyCompletion', function(request, response){
	
	
	  var query = request.query;
	  var recipeId = query.crId;
	  var productId = query.poId;
	  console.log("Completion for RecipeId:  "+recipeId+"  has been completed.");
		  console.log("Completion for ProductId:  "+productId+"  has been completed.");
	//Mark the status completed for the productID against this ctrlID.
	//Get the product ID and send the completion Status to ERP.
	
//	update productionorder set productionStatus='completed' where id = '0325eea3-d965-4a99-8a53-ba5bbc3f9ba9'
		var	sqlQuery = "update productionorder set productionStatus = ? where id = ?";
		var update = ["completed",productId];
		setRequestedData(sqlQuery, update, function (err, results) {
			if (err) console.log(err);
			
		});
	
		  	var sqlQuery = "select * from productionorder where id ='" + productId + "'";	
	  getRequestedData(sqlQuery, function (err, rows, fields) {
		  			if (err) console.log(err);
			if(rows.length>0){
				var coId = rows[0].customerOrder;
				
	///////////////////////////////////Code for post request
  			  var myUrl = 'http://localhost:9000/erp/notifyCompletion';			  
			///////////////////////////////////////////////////////////////////////////////////////////////////////////	When All is done, send notification to ERP.								
			  var options = {
				  url:myUrl,
				qs:{customerId:coId},
				method: "POST"
			  }
			  
			  //console.log(JSON.stringify(options));

			  request_client(options , function(error, response, body){
				  if(error) {
					  console.log(error);
				  } else {
					  //console.log(response.statusCode, body);
				  }
				});
			///////////////////////////////////////////////////////////////////////////////////////////////////////////	When All is done, send notification to ERP.				
				
				
				
				
			}
		  
		  
		  
	  });
	
	
	response.end();
	
	
});



/////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////This function returns the links to get all the producsts and materials/////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/warehouseOne', function(request, response){

console.log("HELLO");
var category;
category = "materials";
var materials_uri = get_uri("get-all-"+category,"Get All "+category,"GET",null,category,null,true);
category = "products";
var products_uri = get_uri("get-all-"+category,"Get All "+category,"GET",null,category,null,true);	

   var entity_element = {

		"actions": [
				materials_uri,
				products_uri	
		  ]
  };

  response.setHeader('Content-Type', HypermediaType.SIREN);								
  response.send(JSON.stringify(entity_element));
  //response.send(warehouseController.readWarehouseView(request.url));
});
/////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////This function returns the links to get all the producsts and materials/////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////This function returns the materials or products, depending on the Type. Type could be materials or products/////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//http://localhost/warehouse/materials
app.get('/warehouse/:type', function(request, response){
  //var warehouse = warehouseController.readWarehouse();
  var type = request.params.type;
  var insertedId;
  var supplier_or_customer;
	var edit_fields = [
	{ "name": "category", "type": "string"},
	{ "name": "type", "type": "string" },
	{ "name": "quantity", "type": "string" }
	]; 
  var entity = [];
  var entity_element = {
	  class: type,
	  			properties: { 
			},
			links: [
			],
		  "actions": [
		  ]
  };  
  //console.log(Object.keys(warehouse));		//This will return   materials,products.
 if(type == "materials"){supplier_or_customer = "supplier";}
else if(type == "products"){supplier_or_customer = "customer";}	

 
  if(type == "products" || type == "materials"){
	  
	  var sql_ordered = "SELECT *FROM "+type;
	getRequestedData(sql_ordered,function(err, rows, fields){
			if (err) {
				console.log('Error: ' + err);
				return;
			}
		
						  response.setHeader('Content-Type', HypermediaType.SIREN);
						 console.log(rows[0]); 
			for(var i=0;i<rows.length;i++){

  var entity_element = {
	  class: type,
	  			properties: { 
			},
			links: [
			],
		  "actions": [
		  ]
  };			
			
				  insertedId = rows[i].id;				  
				  entity_element.properties["id"]=rows[i].id;
				  entity_element.properties["type"]=rows[i].type; 
				  entity_element.properties["quantity"]=rows[i].quantity;
				  entity_element.properties[supplier_or_customer]=rows[i][supplier_or_customer];  
				 
				  var self_link = { rel: [ 'self' ], href: 'http://localhost/warehouse/'+type+'/'+ insertedId}; 
				  entity_element.links.push(self_link);
				  entity_element.actions.push(get_uri("edit_"+type,"Edit "+ type,"PUT",edit_fields,type,insertedId,false));
				  entity_element.actions.push(get_uri("delete_"+type,"Delete "+ type,"DELETE",null,type,insertedId,false));
				  entity.push(entity_element);

			}
	
 response.status(200).end(JSON.stringify(entity));		

	});	  
  
  }  
  else {
      response.status(404).send({code: '404', description: 'cannot find the object ' + type, back: '/warehouse' });
  }
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////This function returns the materials or products, depending on the Type. Type could be materials or products/////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////This function returns the material or product, depending on the type and ID. Type could be materials or products,//////////
////////////////////whereas ID would be the unique id of the material or produuct ro be found///////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//http://localhost/warehouse/materials/c0f1cfe3-93e7-483c-bfe6-3553d9119dbe
app.get('/warehouse/:type/:id', function(request, response){
  
  var query = request.params;
  //var warehouse = warehouseController.readWarehouse();
  var type = request.params.type;
  var id = request.params.id;
  var supplier_or_customer;
  var insertedId;
  var category;
  var edit_fields;
  
/*
  if(warehouse.hasOwnProperty(type) &&
    warehouse[type].hasOwnProperty([id]))
*/	
	if(  query.hasOwnProperty('type') &&  query.hasOwnProperty('id')){
		  
		  var sql_ordered = 'SELECT *FROM ' + type + ' WHERE ID=' + id;
		
					getRequestedData(sql_ordered,function(err, rows, fields){
                        if (err) {
                            console.log('Error: ' + err);
                            return;
                        }

category = query["type"];					
if(query["type"] == "materials"){supplier_or_customer = "supplier";}
else if(query["type"] == "products"){supplier_or_customer = "customer";}							
														
									response.setHeader('Content-Type', HypermediaType.SIREN);															
									var entity;

						if(rows.length>0){
///////////////////////////////////////////////////////////////////////////////////////////////////////////////Generating Hypermedia
	edit_fields = [
	{ "name": "category", "type": "string"},
	{ "name": "type", "type": "string" },
	{ "name": "quantity", "type": "string" }
	];  
									insertedId = rows[0].id;																						
									entity = {
										class: query["type"],
										properties: { 
											id: insertedId,
											type: rows[0].type, 
											quantity: rows[0].quantity,
											[supplier_or_customer]: rows[0][supplier_or_customer]
										},
										links: [
										  { rel: [ 'self' ], href: 'http://localhost/warehouse/'+category+'/'+ insertedId}
										],
										  "actions": [
										get_uri("edit_"+category,"Edit "+ category,"PUT",edit_fields,category,insertedId,false),									  
										get_uri("delete_"+category,"Delete "+ category,"DELETE",null,category,insertedId,false),
										get_uri("get-all-"+category,"Get All "+category,"GET",null,category,insertedId,true)

									  ]
									  };
///////////////////////////////////////////////////////////////////////////////////////////////////////////////Generating Hypermedia
									response.status(200).end(JSON.stringify(entity));															

						}
						else{
///////////////////////////////////////////////////////////////////////////////////////////////////////////////Generating Hypermedia																						
	edit_fields = [
	{ "name": "category", "type": "string"},
	{ "name": "type", "type": "string" },
	{ "name": "quantity", "type": "string" },
	{"name":supplier_or_customer,"type":"string"}
	];  
									entity = {
										class: query["type"],
										description:"No such ID exits in the database.",
										properties: { 
										},
										  "actions": [
										get_uri("insert_"+category,"Insert "+ category,"POST",edit_fields,category,null,false),									  
										get_uri("get-all-"+category,"Get All "+category,"GET",null,category,insertedId,true)

									  ]
									  };
///////////////////////////////////////////////////////////////////////////////////////////////////////////////Generating Hypermedia							
									response.status(404).end(JSON.stringify(entity));
							
						}
                        
                    });		


  }  else {
      response.status(404).send({code: '404', description: 'cannot find the category or item ', back: '/warehouse' });
  }
  
  
  
  
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////This function returns the material or product, depending on the type and ID. Type could be materials or products,//////////
////////////////////whereas ID would be the unique id of the material or produuct ro be found///////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////This function is used to edit the material or product, depending on the type and ID. Type could be materials or products,//////////
////////////////////whereas ID would be the unique id of the material or produuct ro be found///////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//http://localhost/warehouse/materials/1?type=123&category=xyz
app.put('/warehouse/:type/:id', function(request, response){
  //var warehouse = warehouseController.readWarehouse();
  var type = request.params.type;
  var id = request.params.id;
  var query = request.query;
  var supplier_or_customer;

  if( ( (type == "products" && ( query.hasOwnProperty('customer') || query.hasOwnProperty('type') || query.hasOwnProperty('quantity') ) ) || (type == "materials"  && ( query.hasOwnProperty('supplier') || query.hasOwnProperty('type') || query.hasOwnProperty('quantity') ) ) ) ){

if(type == "materials"){supplier_or_customer = "supplier";}
else if(type == "products"){supplier_or_customer = "customer";}

		var sql = 'UPDATE ' + type + ' SET ? WHERE id = ?';
		var post = [query,id];

setRequestedData(sql,post,function(err,result){	

		if(err){
			console.log(err);		
		}

		if( result.affectedRows == 1 ){			
///////////////////////////////////////////////////////////////////////////////////////////////////////////////Generating Hypermedia
var	edit_fields = [
	{ "name": "category", "type": "string"},
	{ "name": "type", "type": "string" },
	{ "name": "quantity", "type": "string" }
	];  

	response.setHeader('Content-Type', HypermediaType.SIREN);	
									var insertedId = id;																						
									var entity = {
										class: type,
										properties: { 
											id: insertedId,
											type: query.type, 
											quantity: query.quantity,
											[supplier_or_customer]: query[supplier_or_customer]
										},
										links: [
										  { rel: [ 'self' ], href: 'http://localhost/warehouse/'+type+'/'+ insertedId}
										],
										  "actions": [
										get_uri("edit_"+type,"Edit "+ type,"PUT",edit_fields,type,insertedId,false),									  
										get_uri("delete_"+type,"Delete "+ type,"DELETE",null,type,insertedId,false),
										get_uri("get-all-"+type,"Get All "+type,"GET",null,type,insertedId,true)

									  ]
									  };
///////////////////////////////////////////////////////////////////////////////////////////////////////////////Generating Hypermedia			
					response.status(200).end(JSON.stringify(entity));			
		}
		else{
///////////////////////////////////////////////////////////////////////////////////////////////////////////////Generating Hypermedia
var	edit_fields = [
	{ "name": "category", "type": "string"},
	{ "name": "type", "type": "string" },
	{ "name": "quantity", "type": "string" },
	{"name":supplier_or_customer,"type":"string"}
	];  

	response.setHeader('Content-Type', HypermediaType.SIREN);																							
									var entity = {
										class: type,
										description:"Can not find the specific item by its ID",
										properties: { 
										},
										  "actions": [
										get_uri("insert_"+type,"Insert "+ type,"POST",edit_fields,type,null,false),									  
										get_uri("get-all-"+type,"Get All "+type,"GET",null,type,null,true)

									  ]
									  };
///////////////////////////////////////////////////////////////////////////////////////////////////////////////Generating Hypermedia							
		response.status(404).end(JSON.stringify(entity));	
		}

		


});		



  }  
  else {
      response.status(404).send({code: '404', description: 'cannot find the category or item ', back: '/warehouse' });
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////This function is used to edit the material or product, depending on the type and ID. Type could be materials or products,//////////
////////////////////whereas ID would be the unique id of the material or produuct ro be found///////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////This function is used to delte the material or product, depending on the type and ID. Type could be materials or products,//////////
////////////////////whereas ID would be the unique id of the material or produuct to be deleted///////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//http://localhost/warehouse/materials/c0f1cfe3-93e7-483c-bfe6-3553d9119dbe
app.delete('/warehouse/:type/:id', function(request, response){
  //var warehouse = warehouseController.readWarehouse();
  var type = request.params.type;
  var id = request.params.id;
  var supplier_or_customer;
	
  if( type == "products" || type == "materials" ){

if(type == "materials"){supplier_or_customer = "supplier";}
else if(type == "products"){supplier_or_customer = "customer";}  

		var sql = 'DELETE FROM ' + type + ' WHERE id = ?';
		var post = [id];
setRequestedData(sql,post,function(err,result){	

		if(err){
			console.log(err);		
		}

		if( result.affectedRows == 1 ){			
///////////////////////////////////////////////////////////////////////////////////////////////////////////////Generating Hypermedia
var	edit_fields = [
	{ "name": "category", "type": "string"},
	{ "name": "type", "type": "string" },
	{ "name": "quantity", "type": "string" }
	];  

	response.setHeader('Content-Type', HypermediaType.SIREN);	
									var insertedId = id;																						
									var entity = {
										class: type,
										properties: { 
											id: id
										},
										  "actions": [
										get_uri("insert_"+type,"Insert "+ type,"POST",edit_fields,type,null,false),											  
										get_uri("get-all-"+type,"Get All "+type,"GET",null,type,null,true)

									  ]
									  };
///////////////////////////////////////////////////////////////////////////////////////////////////////////////Generating Hypermedia			
					response.end(JSON.stringify(entity));			
		}
		else{
///////////////////////////////////////////////////////////////////////////////////////////////////////////////Generating Hypermedia
var	edit_fields = [
	{ "name": "category", "type": "string"},
	{ "name": "type", "type": "string" },
	{ "name": "quantity", "type": "string" },
	{"name":supplier_or_customer,"type":"string"}
	];  

	response.setHeader('Content-Type', HypermediaType.SIREN);																							
									var entity = {
										description:"No such Id exists",
										class: type,
										properties: { 
										},
										  "actions": [
										get_uri("insert_"+type,"Insert "+ type,"POST",edit_fields,type,null,false),									  
										get_uri("get-all-"+type,"Get All "+type,"GET",null,type,null,true)

									  ]
									  };
///////////////////////////////////////////////////////////////////////////////////////////////////////////////Generating Hypermedia							
		response.status(404).end(JSON.stringify(entity));	
		}

		


});				
		

  }  
  else {
      response.status(404).send({code: '404', description: 'cannot find the category or item ', back: '/warehouse' });
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////This function is used to delte the material or product, depending on the type and ID. Type could be materials or products,//////////
////////////////////whereas ID would be the unique id of the material or produuct to be deleted///////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////This function is used to create the material or product, depending on the category. Category could be materials or products,//////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//localhost:80/warehouse?category=ASD&type=XYZ&quantity=7&supplier=X
//////////////////////////////////////////////////////////////////////Production Order
app.post('/warehouse/productionorder', function(request, response){

//var warehouse = warehouseController.readWarehouse();  
//console.log("in warehouse");
//	qs:{category:'products',type:'phone',quantity:quantity,customer:userName,id_products:inputs.id,phoneName:phoneName}.  
//  qs:{category:'products',type:'phone',quantity:quantity,customer:userName,id_customer:details.id,phoneName:phoneName},
  var query = request.query;
  var isPostRight=true;
  var insertedId;
  if(query.hasOwnProperty('quantity') && query.hasOwnProperty('id_customer') && query.hasOwnProperty('phoneName') ){
///////////////////////////////////////////////Insert Data in to production order.
console.log("Received Production Order.");
					var post;
					var sql;
					//var sql = 'INSERT INTO ' + category + ' SET ?';
					sql = "insert into productionorder set ?";
                    post = {
                           id : uuid.v4(),
                           customerOrder : query.id_customer,
                           productionStatus : "processing"
                    }
                            					
					setRequestedData(sql,post,function(err,result){
									if(err){
										console.log(err);		
									}
									console.log(result);
///////////////////////////////////////////////////////////////////////////////////////////////////////////////Generating Hypermedia								
									response.setHeader('Content-Type', HypermediaType.SIREN);															
									var entity = {
										class: "products",
										properties: { 
											id:post.id,
											customerOrder:post.customerOrder,
											productionStatus:"processing"
										},
										links: [
										  { rel: [ 'self' ], href: 'http://localhost:8000/warehouse/productionorder/'+ post.id}
										],
										  "actions": [
										//get_uri("edit_"+category,"Edit "+ category,"PUT",edit_fields,category,insertedId,false),									  
										//get_uri("delete_"+category,"Delete "+ category,"DELETE",null,category,insertedId,false),
										//get_uri("get-all-"+category,"Get All "+category,"GET",null,category,insertedId,true)

									  ]
									  };
///////////////////////////////////////////////////////////////////////////////////////////////////////////////Generating Hypermedia
									response.status(200).end(JSON.stringify(entity));		

									
					var sql_ordered = "SELECT *FROM phones WHERE phoneName = '"+ query.phoneName+"'";
					//console.log(sql_ordered);
					  //var sql_ordered = "SELECT *FROM "+type;
					getRequestedData(sql_ordered,function(err, rows, fields){
							if (err) {
								console.log('Error: ' + err);
								return;
							}
						
//If the Phone exits then reserve it.		
							if(rows.length>0){
									//reserveMaterials(query.id_products,rows[0],query["quantity"]);										
									reserveMaterials(post.id,rows[0],query["quantity"]);
							}						
					

					});	  

					

					});

														
				

	
  }else{
	response.status(400).send({code: '400', description: 'Query not complete ', back: '/warehouse', format : '/warehouse/productionorder?quantity=quantity&id_customer=customerid&phoneName=phoneName' })
  }

});

//////////////////////////////////////////////////////////////////////Production Order
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////This function is used to create the material or product, depending on the category. Category could be materials or products,//////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//The application provides a search functionality for the resources by resource type, date, supplier/customer.
//Example: …?type=material1&receivedBefore=23-03-2016&supplier=supplier1.



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////This function is used to search the material or product, depending on the category. Category could be materials or products,//////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/warehouse', function(request, response){
	
	  //var warehouse = warehouseController.readWarehouse();
  var query = request.query;
  var isPostRight=true;
  var insertedId;
  if(query.hasOwnProperty('category') &&
    query.hasOwnProperty('type') ||
    query.hasOwnProperty('receivedBefore') ||
    (query.hasOwnProperty('supplier') || query.hasOwnProperty('customer') ) 
  ){
	  
		var supplier_or_customer;
		var supplier_or_customer_value;
		var category = query["category"];
		var edit_fields = [
		{ "name": "category", "type": "string"},
		{ "name": "type", "type": "string" },
		{ "name": "quantity", "type": "string" }
	  ];

	  if( (query.hasOwnProperty('supplier') && query["category"] == "products" )  ||  (query.hasOwnProperty('customer') && query["category"] == "materials" ) ||  (query["category"] != "products" &&  query["category"] != "materials" )   ){
			isPostRight=false;
		  
	  }

			if(isPostRight){

if(category == "materials"){supplier_or_customer = "supplier";}
else if(category == "products"){supplier_or_customer = "customer";}	
			
			
		var myKeys=Object.keys(query);		
		var sql = 'SELECT *FROM ' + category + ' WHERE ';
		var post = null;

////////////////////////////////////////////////////////////////////////////////////Query builder		
for(var i=0;i<myKeys.length;i++){
	
if(myKeys[i]!="category"){
	
	if( i<myKeys.length-1 ){
		if(myKeys[i]=="receivedBefore"){
		sql = sql + "date" + " <= " +  "'"  +  query[myKeys[i]] + "'" +" AND ";			
		}
		else{
		sql = sql + myKeys[i] + " = " +  "'"  +  query[myKeys[i]] + "'" +" AND ";			
		}

	
	}
	else{
		if(myKeys[i]=="receivedBefore"){
		sql = sql + "date" + " <= " +  "'"  +  query[myKeys[i]] + "'";		
		}
		else{
		sql = sql + myKeys[i] + " = " +  "'"  +  query[myKeys[i]] + "'";			
		}
		
	
	}

}

	
}
////////////////////////////////////////////////////////////////////////////////////Query builder
		

					setRequestedData(sql,post,function(err,result){
									if(err){
										console.log(err);		
									}
					//console.log(result);	
  var entity = [];
   var entity_element_empty = {
	  class: category,
	  description:"No such values have met the search criteria",
	  			properties: { 
			},
			links: [
			],
		  "actions": [
		  			get_uri("insert_"+category,"Insert "+ category,"POST",edit_fields,category,null,false),									  
					get_uri("get-all-"+category,"Get All "+category,"GET",null,category,null,true)
		  ]
  };	 
  var isEmpty = true;
  			for(var i=0;i<result.length;i++){
isEmpty = false;
  var entity_element = {
	  class: category,
	  			properties: { 
			},
			links: [
			],
		  "actions": [
		  ]
  };			
			
				  insertedId = result[i].id;				  
				  entity_element.properties["id"]=result[i].id;
				  entity_element.properties["type"]=result[i].type; 
				  entity_element.properties["quantity"]=result[i].quantity;
				  entity_element.properties[supplier_or_customer]=result[i][supplier_or_customer];  
				 
				  var self_link = { rel: [ 'self' ], href: 'http://localhost/warehouse/'+category+'/'+ insertedId}; 
				  entity_element.links.push(self_link);
				  entity_element.actions.push(get_uri("edit_"+category,"Edit "+ category,"PUT",edit_fields,category,insertedId,false));
				  entity_element.actions.push(get_uri("delete_"+category,"Delete "+ category,"DELETE",null,category,insertedId,false));
				  entity.push(entity_element);

			}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////Generating Hypermedia								
									response.setHeader('Content-Type', HypermediaType.SIREN);															

///////////////////////////////////////////////////////////////////////////////////////////////////////////////Generating Hypermedia
									if(isEmpty){
											response.status(404).end(JSON.stringify(entity_element_empty));
									}
									else{
											response.status(200).end(JSON.stringify(entity));								
									}
																	

									
					});

														
				}
				else{
				response.status(400).send({code: '400', description: 'Query is incorrect ', back: '/warehouse', format : '/warehouse?category=cat&type=type' })	
				}	  
				
	  
  }
	else{
	response.status(400).send({code: '400', description: 'Query not complete ', back: '/warehouse', format : '/warehouse?category=cat&type=type' })
  }

	
	
	
	
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////This function is used to search the material or product, depending on the category. Category could be materials or products,//////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////This function is used to reserve the specific material for a specific product, ///////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//localhost:80/warehouse/reserve?materialid=1&productid=1
app.post('/warehouse/reserve', function(request, response){
	
  var query = request.query;
  var isPostRight=true;
  var insertedId;
  if(query.hasOwnProperty('productionid') ){

//First get the customerId from the productionId, then use the customerId to retrieve information like quantity and recipe.  
		var sqlQuery = "select * from productionorder where id ='" + query.productionid + "'";
		getRequestedData(sqlQuery, function (err, rows, fields) {
					  
				if (err) console.log(err);
				
				if (rows.length > 0) {
					//reserves the materials against the given product.
					//if not enough materials than contacts ERP.
					var customerOrderId = rows[0].customerOrder;
					//var phoneName = rows[0].phoneName;
					//reserveMaterials(query.productionid,rows[0],query["quantity"]);					
							var sql_customer = "SELECT *FROM customerorder WHERE id = '"+ customerOrderId+"'";
							//console.log(sql_ordered);
							  //var sql_ordered = "SELECT *FROM "+type;
							getRequestedData(sql_customer,function(err2, rows2, fields2){
								
											
								if (err2) console.log(err2);
								
								if (rows2.length > 0) {
									var phoneName = rows2[0].phoneName;
									var quantity = rows2[0].quantity;
									var sql_ordered = "SELECT *FROM phones WHERE phoneName = '"+ phoneName+"'";
									//console.log(sql_ordered);
									  //var sql_ordered = "SELECT *FROM "+type;
									getRequestedData(sql_ordered,function(err1, rows1, fields1){
											if (err1) {
												console.log('Error: ' + err1);
												return;
											}
										
							
											if(rows1.length>0){
												//console.log("Reserving");
													//reserveMaterials(query.id_products,rows[0],query["quantity"]);										
													reserveMaterials(query.productionid,rows1[0],quantity);
											}						
									

									});	
								
								}						
								
							});

							
					
			response.status(200).send({code: '200', description: 'Materials are reserved ', back: '/warehouse'});						
				}
				else{
					
			response.status(400).send({code: '400', description: 'ProdutionId doesnot exist ', back: '/warehouse'});				
					
				}
				
					  
		});
	  


	  
	  
  }
  else{
	response.status(400).send({code: '400', description: 'Query not complete ', back: '/warehouse', format : '/warehouse/reserve?productionid=productid' });
	  
  }		

	
	
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////This function is used to reserve the specific material for a specific product, ///////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



app.listen(8000, function() {
  console.log('Server started.');}
);
