# salesforce_orm
A NodeJS library for connecting to the Salesforce Enterprise SOAP API and do all operations in a simplified way.

Short "how to use" guide is under construction.

## How this library is gonna to help me?

This library is going to manage these things for you:
* Salesforce SOAP API connection and session management.
* Object and query-formatting.
* Response retrieval and parsing.
* Other time-wasting things!

## Code Example

###Initializing
First step is loading and initializing the library:

```javascript
let Salesforce = require('salesforce_orm');
let username = 'your@salesforce-user.com';
let password = 'yourPassword';
let token = 'yourToken';
let wsdlPath = __dirname+'/config/production.wsdl.xml';

let salesforce = new Salesforce(username, password, token, wsdlPath);
```

###Adding new model
salesforce_orm needs to know with which Salesforce objects are you gonna to work, and which fields are part of that objects, so you will need to add those models following this example:

```javascript
this.salesforce.addModel({
		name: 'Account',
		fields: ["Id", "Name"] //Add here all API Names of Account fields
});
```

##Creating new object instance

Before start creating, updating, or removing records, you need to create a new model instance. The following example shows how to do it:

```javascript
let newObjectInstance = salesforce.instanceNewObject('Account');
```
Also, if you previously have a Javascript object with all record's data, you can create a new instance with these data:

```javascript
let existentObjectInstance = salesforce.instanceExistentObject('Account',{Id: '1234567890123456'}); //Here you can pass any model's properties
```

###Retrieve records
```javascript
existentObjectInstance.get().then(()=>{
	console.log(`Hello world! My name is ${existentObjectInstance.Name}`);
});
```

###Create records
```javascript
newObjectInstance.Name = 'My awesome new account';
newObjectInstance.create().then(()=>{
	console.log(`Hello world! My new account's name is ${newObjectInstance.Name}`);
});
```

###Update records
```javascript
existentObjectInstance.Name = `${existentObjectInstance.Name} (edited)`;
existentObjectInstance.update().then(()=>{
	console.log(`Oh! My existent account has been edited and its name is now ${existentObjectInstance.Name}`);
});
```
###Remove records
```javascript
existentObjectInstance.remove().then(()=>{
  console.log(`I'm so sad D=, an account has been removed from Salesforce.`);
});
```

###Search records
```javascript
salesforce.search("Account", "Name LIKE = 'My awesome new account'").then((records)=>{
  console.log(`${records.length} records have been found.`);
  for(let i in records){
    let record = records[i];
    console.log(`${record.Name} found! (${record.Id})`);
    
    //And here magic happens... Feel free to use all available methods (as delete or update) with these results...
    record.Name = 'Changed name';
    record.update();
  }
});
```

##Hakuna Matata!
