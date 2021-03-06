//  Bamazon Customer program

var Table = require('cli-table');

var mysql = require("mysql");
var inquirer = require('inquirer');

var connection = mysql.createConnection({
    host: "localhost",

    // Your port; if not 3306
    port: 3306,

    // Your username
    user: "root",

    // Your password
    password: "",
    database: "bamazon"
});


let arrID = [];
let arrQuantity = [];
let arrProductName = [];
let arrPrice = [];
let productQuantity;
// let price;
let objItem;

// connect to the database and call customerOrder
connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    customerOrder()

});

// CustomOrder produces a list of the products and then prompts the user
// place an order
var customerOrder = function () {

    // We run a query against all products
    let myQuery = "SELECT * FROM products";
    connection.query(myQuery, function (err, items) {
        if (err) throw err;
        // console.log(res);
        items.forEach(product => {
            arrID.push(product.item_id);
            arrQuantity.push(product.stock_quantity);
            arrProductName.push(product.product_name);
            arrPrice.push(product.price);
            
        });
        // a for loop will also work:  
        // for (let i = 0; i < items.length; i++) {
        //     const element = items[i];
        //     console.log("for loop element: ", element);
        // }

        //Call the print table function to print all products
        printTable(items);
        console.log("calling customer Inquirer")
        // This is the prompt for the client purchase
        inquirer.prompt([{
                type: 'input',
                name: 'item_identity',
                message: "Select a product ID to purchase an item:",
                validate: function (item_identity) {
                    if (arrID.indexOf(parseInt(item_identity)) < 0) {
                        return "Please enter a valid ID";
                    } else {
                        let i = arrID.indexOf(parseInt(item_identity));
                        // console.log("\ni: ", i + " " + arrQuantity[i]);
                        productQuantity = arrQuantity[i];
                        productName = arrProductName[i];
                        // price = arrPrice[i];
                        objItem = { 'productName': arrProductName[i], 'quantity': arrQuantity[i], 'price': arrPrice[i] };
                        // console.log("price: ", price);
                        return true;
                    }
                }
            },
            {
                type: 'input',
                name: 'quantity',
                message: "How many units would you like to purchase?",
                validate: function (quantity) {
                    // console.log("productQuantity: ", quantity);
                    // console.log("typeof quantity: ", typeof quantity);
                    // console.log("typeof parseint(quantity): ", typeof parseInt(quantity));
                    // console.log("parseInt(quantity): ", parseInt(quantity));
                    // Validate for NaN and if the quantity is greater than
                    if (isNaN(parseInt(quantity)))
                        return "invalid amount -- not numeric";
                    if (objItem.quantity < parseInt(quantity)) {
                        return "Insufficient Stock";
                    } else {
                        return true;
                    }
                }
            }
        ]).then(function (custInput) {
            // .then handles the database update
            console.log("Inquirer User Input: ", custInput);
            let remainingQuantity = productQuantity - parseInt(custInput.quantity)
            console.log("remaining Quantity: ", remainingQuantity);

            var query = connection.query(
                "UPDATE products SET ? WHERE ?",
                [{
                        stock_quantity: remainingQuantity
                    },
                    {
                        item_id: custInput.item_identity
                    }
                ],
                function (err, res) {
                    console.log(res.affectedRows + " products updated!\n");
                    // print the order with the total purchase price using CLI-Table
                    PrintTableVert(objItem.productName, custInput.quantity, objItem.price);
                    // Prompt the user if they want to return for another purchase
                    inquirer.prompt([{
                        type: 'input',
                        name: 'isBackToCustOrder',
                        message: "Do you want to return to the order menu? (Y/N)"
                    }]).then(function (userInput) {
                        if (userInput.isBackToCustOrder.toUpperCase() === 'Y') {
                            customerOrder();
                        } else {
                            closeConnection();
                        }
                    })
                }
            );
        });
    });

}

function printTable(arrTable) {
    // instantiate
    const table = new Table({
        head: ['Item Id', 'Product Name', 'Price'],
        colWidths: [10, 50, 10]
    });

    // table is an Array, so you can `push`, `unshift`, `splice` and friends
    arrTable.forEach(product => {
        table.push([product.item_id, product.product_name, product.price]);
    });

    console.log(table.toString());

}

function PrintTableVert(productName, quantity, unitPrice) {
    let totalCost = quantity * unitPrice;
    // vertical tables
    console.log("printTablleVert - entry");
    console.log("parms: ", productName + " " + quantity + " " + totalCost);

    var table2 = new Table();

    table2.push({
        'Product': productName
    }, {
        'Quantity': quantity
    }, {
        'total cost': totalCost
    });

    console.log(table2.toString());
}

function closeConnection() {
    setTimeout(function () {
        connection.end();
        console.log("=====> connection closed");
    }, 2000);
}