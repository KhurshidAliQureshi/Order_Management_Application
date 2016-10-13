var mysql = require('mysql');
var express = require('express'),
    app = express();
var HypermediaType = require('hypermedia-type');
var uuid = require('node-uuid');
var request_client = require('request');
var Client = require('node-rest-client').Client;
var http = require('http');

var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'xyz12345',
    database : 'fis_assignment_5'
});

connection.connect();



/////SQL commands to be executed here. ///////

function setRequestedData(sql, post, callback) {
    
    connection.query(sql, post, function (err, result) {
        if (err) {
            callback(err);
        }
        
        callback(null, result);
    });
 
}

function getRequestedData(sql, callback) {
    
    connection.query(sql, function (err, rows, fields) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, rows, fields);
  
    });
 
}

/////SQL commands to be executed here. ///////


//////This function is used to generate URI's for different operations/////////

function get_uri(name, title, operation, fields, category_item, insertedId, show_all) {
    
    var uri;
    if (insertedId == null) {
        uri = 'http://localhost:9000/erp/' + category_item;
    }
    else if (show_all) {
        uri = 'http://localhost:9000/erp/' + category_item;
    }
    else {
        
        uri = 'http://localhost:9000/erp/' + category_item + '/' + insertedId;
    }
    
    var return_uri = {
        "name": name,
        "title": title,
        "method": operation,
        "href": uri,
        "type": "application/x-www-form-urlencoded",
        "fields": fields
    };
    
    return return_uri;
	
};

//////This function is used to generate URI's for different operations//////

/*
var warehouseView = {
    materials : "/warehouse/materials",
    products : "/warehouse/products"
};
*/

//////      ERP  Sales   ///////

app.get('/erpOne', function (request, response) {
    
    var category;
    category = "customerOrder";
    var materials_uri = get_uri("get-all-" + category, "Get All " + category, "GET", null, category, null, true);
    category = "purchaseOrder";
    var products_uri = get_uri("get-all-" + category, "Get All " + category, "GET", null, category, null, true);
    
    var entity_element = {
        
        "actions": [
            materials_uri,
            products_uri
        ]
    };
    
    response.setHeader('Content-Type', HypermediaType.SIREN);
    response.send(JSON.stringify(entity_element));
});


app.post('/erp/notifyCompletion', function (request, response) {
	
	  var query = request.query;
	  var customerId = query.customerId;
	  console.log("Completion for CustomerId:  "+customerId+"  has been completed.");
	  
		var	sqlQuery = "update customerorder set orderStatus = ? where id = ?";
		var update = ["completed",customerId];
		setRequestedData(sqlQuery, update, function (err, results) {
			if (err) console.log(err);
			
		});
	  
	  
	  
	  
	  
	
	
	response.end();
	
	
	
});

app.post('/erp/customerOrder', function (request, response) {
    var query = request.query;
    var quantity = query.quantity;
    var phoneName = query.phoneName;
    var userName = query.userName;
    
    if (quantity != null && userName != null && phoneName != null) {
        var sqlQuery = "select * from accounts where userName ='" + userName + "'";
        
        getRequestedData(sqlQuery, function (err, rows, fields) {
            if (err) console.log(err);
            if (rows.length > 0) {
                var sqlQuery = "select * from phones where phoneName ='" + phoneName + "'";
                
                getRequestedData(sqlQuery, function (err, rows, fields) {
                    if (err) console.log(err);
                    if (rows.length > 0) {
                        
                        var details = {
                            id : uuid.v4(),
                            userName : userName,
                            phoneName : phoneName,
                            quantity : quantity,
                            totalCost : quantity * rows[0].phoneCost,
                            orderStatus : "pending"
                        }
                        
                        sqlQuery = "insert into customerOrder set ?";
                        
                        setRequestedData(sqlQuery, details, function (err, results) {
                            if (err) console.log(err);
                            
                            var customerOrder = "Entered"
                            

///////////////////////////////////////////////////////////////////////////////////////////////////////////									
  //category:'products' => since its a production order
  var options = {
    url: 'http://localhost:8000/warehouse/productionorder',
	//qs:{category:'products',type:'phone',quantity:quantity,customer:userName,id_products:inputs.id,phoneName:phoneName},
	qs:{category:'products',type:'phone',quantity:quantity,customer:userName,id_customer:details.id,phoneName:phoneName},
    method: "POST"
  }
  
  //console.log(JSON.stringify(options));
  request_client(options , function(error, response, body){
      if(error) {
          console.log(error);
      } else {
          console.log("Sent Production Order");
		  sqlquery = "update customerorder set orderstatus = 'sent to production' where id = ?";
		  setRequestedData(sqlquery, details.id, function (err, results) {
					if (err) console.log(err);

					console.log("Customer order is sent to production.");
		  });

	  	  
      }
    });
///////////////////////////////////////////////////////////////////////////////////////////////////////////	

		var currentStatus = "order sent to production.";
       var finalResult = {
                   customerOrder : customerOrder,
                   currentStatus : currentStatus
        };
response.status(201).send({ code : "201", back: '/erp', description : finalResult });		


                        });//Customer Order Query.

                    }
                    else {
                        response.status(400).send({ code: '400', description: 'phonename not found', back: '/erp', format : '/erp/customerOrder?' });
                    }
                });
            }
            else {
                response.status(400).send({ code: '400', description: 'one or more parameters are invalid or missing', back: '/erp' });
            }
        });
    }
    else { 
        response.status(400).send({ code: '400', description: 'username not found', back: '/erp' });
    }
});


app.get('/erp/customerOrder', function (request, response) {
    
    
    var query = request.query;
    var id = query.id;
    var userName = query.userName;

    if (userName != null) {

        var sqlQuery = "select * from customerOrder where userName ='" + userName + "'";

        getRequestedData(sqlQuery, function (err, rows, fields) {
            if (err) console.log(err);
            if (rows.length > 0) { 
                response.status(200).send({ code : "200", back: '/erp', description : rows });
            }
            else { 
                response.status(404).send({ code: '404', description: 'no order by ' + userName + ' found', back: '/erp'});
            }
        });
    }
    else if (id != null) { 
        var sqlQuery = "select * from customerOrder where id ='" + id + "'";
        
        getRequestedData(sqlQuery, function (err, rows, fields) {
            if (err) console.log(err);
            if (rows.length > 0) { 
                response.status(200).send({ code : "200", back: '/erp', description : rows });
            }
            else {
                response.status(400).send({ code: '404', description: 'no order with ' + id + ' found', back: '/erp' });
            }
        });
    }
    else {
        var format = {

            userName : [
            "/erp/customerOrder?userName=value"
            ],
            id : [
                "/erp/customerOrder?id=value"
            ]
        };
        response.status(404).send({ code: '404', description: 'attribute not found', back: '/erp', format : format  });
    }
});

//////      ERP Sales      //////

//////      ERP Procurement      //////

app.post('/erp/purchaseOrder', function (request, response) {

console.log("received Purchase Order");
    var query = request.query;
    var materialName = query.materialName;
    var quantity = query.quantity;
    var POId = query.POId;
    
    if (materialName != null && quantity != null && POId != null) {
        var sqlQuery = "select * from warehousestock where materialName ='" + materialName + "'";
        getRequestedData(sqlQuery, function (err, rows, fields) {
            if (err) console.log(err);
            if (rows.length > 0) {
                
                sqlQuery = "select * from productionorder where id ='" + POId + "'";
                
                getRequestedData(sqlQuery, function (err, rows, fields) {
                    if (err) console.log(err);
                    if (rows.length > 0) {
                        
                        sqlQuery = "insert into purchaseorder set ?";
                        var data = {
                            id : uuid.v4(),
                            productionOrder : POId,
                            materialName : materialName,
                            quantity : quantity,
                            POStatus : "processing",
                            supplier : materialName+" supplier"
                        }
                        
                        setRequestedData(sqlQuery, data, function (err, results) {
                            if (err) console.log(err);
                            var POStatus = data.POStatus;
                            
                            sqlQuery = "update warehousestock set currentStock = currentStock + ? where materialName = ?";
                            var update = [
                                quantity,
                                materialName
                            ];
                            setRequestedData(sqlQuery, update, function (err, results) {
                                if (err) console.log(err);
                                var stockStatus = quantity + "pieces of " + materialName + " purchased";
                                
                                sqlQuery = "update purchaseorder set POStatus = ? where id = ?";
                                var inserts = [
                                    "completed",
                                    data.id
                                ];
                                setRequestedData(sqlQuery, inserts, function (err, results) {
                                    if (err) console.log(err);
                                    var finalStatus = {
                                        POStatus : POStatus,
                                        stockStatus : stockStatus,
                                        purchaseOrderStatus : "order with id " + data.id + " completed"
                                    }
                                    
                                    response.status(201).send({ code : "201", back: '/erp', description : finalStatus });
                                });
                            });
                        });
                    }
                    else {
                        response.status(404).send({ code: '404', description: 'production order with id =  ' + POId + ' not found', back: '/erp' });
                    }
                });
            }
            else {
                response.status(404).send({ code: '404', description: 'This material does not exist, please create entry first', back: '/erp' });
            }
        });
    }
    else {
        response.status(404).send({ code: '404', description: 'one or more parameters are invalid', back: '/erp' });
    }
});

app.get('/erp/purchaseOrder/:id', function (request, response) {
    var id = request.params.id;
    if (id != null) {
        var sqlQuery = "select * from purchaseorder where id ='" + id + "'";
        getRequestedData(sqlQuery, function (err, rows, fields) {
            if (err) console.log(err);
            if (rows.length > 0) {
                response.status(200).send({ code : "200", back: '/erp', description : rows });
            }
            else {
                response.status(404).send({ code: '404', description: 'purchase order with production order id =  ' + id + ' does not exist', back: '/erp' });
            }
        });
    }
    else {
        response.status(404).send({ code: '404', description: 'id not entered', back: '/erp' });
    }
});

app.put('/erp/purchaseOrder/:id', function (request, response) {
    var id = request.params.id;
    var query = request.query;
    var status = query.POStatus;

    if (id != null && status == "completed") {
        var sqlQuery = "select id from purchaseorder where id ='" + id + "'";
        getRequestedData(sqlQuery, function (err, rows, fields) {
            if (err) console.log(err);
            if (rows.length > 0) {
                sqlquery = "update purchaseorder set postatus = 'completed' where id = ?";
                setRequestedData(sqlquery, id, function (err, results) {
                    if (err) console.log(err);
                    response.status(200).send({ code : "200", back: '/erp', description : "updated" });
                });
            }
            else { 
                response.status(404).send({ code: '404', description: 'valid id not entered', back: '/erp' });
            }
        });       
    }
    else {
        response.status(404).send({ code: '404', description: 'id or status is not entered properly', back: '/erp', format: '/erp/purchaseOrder/:id?POStatus=completed' });
    }
});

//////      ERP Procurement      //////

app.listen(9000, function () {
    console.log('Server started.');
});