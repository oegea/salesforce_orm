(()=>{
	'use strict';

	/**
	 * Librería para interactuar con el SOAP API de Salesforce de forma sencilla
	 */
	class SalesforceORM{

		/**
		 * Inicializa la librería
		 * @param  {String} username Usuario con el que conectarse
		 * @param  {String} password Password con el que conectarse
		 * @param  {String} token    Token de conexión
		 * @param  {String} wsdl     Ruta del fichero WSDL
		 */
		constructor(username, password, token, wsdl){

			//Dependencias
			this.SalesforceConnection = require('./SalesforceConnection');
			this.SalesforceObject     = require('./SalesforceObject');
			this.Q                    = require('q');

			//Guardamos los datos de conexión
			this.username  = username;
			this.password  = password;
			this.token 	   = token;
			this.wsdl      = wsdl;

			//Generamos un gestor de conexión a Salesforce
			this.connexion = new this.SalesforceConnection(username, password, token, wsdl);

			//Variable en la que se almacenarán los modelos de datos existentes
			this.models    = [];
		}

		//Registrar un nuevo modelo:
		
		/**
		 * Registra un nuevo modelo de datos en el ORM
		 * @param 	{Object} 	objectDescription 	Descripción del objeto, objeto con propiedades name y fields
		 * @return 	{Boolean} 						Verdadero o falso dependiendo del éxito en la operación
		 */
		addModel(objectDescription){
			//Recopilamos datos
			let name = objectDescription.name;
			let fields = objectDescription.fields;

			//Si el modelo ya está registrado, retornamos false
			if (this._modelExists(name))
				return false;

			//Añadimos la descripción del objeto al array
			this.models.push(objectDescription);

			//Retornamos verdadero
			return true;
		}

		/**
		 * Comprueba si un modelo ya existe
		 * @param  {String} 	name 	Nombre del modelo a comprobar
		 * @return {Boolean}      		Verdadero en caso de existir, falso en caso contrario
		 */
		_modelExists(name){
			//Iteramos los modelos existentes
			for (let i in this.models){
				//Recopilamos datos
				let model = this.models[i];

				if (model.name === name){
					return true;
				}
			}

			return false;
		}
		
		//Búsqueda de datos en Salesforce:
		
		search(){
			console.error("This functionality is still under development.");
			return;
		}
		
		//Crear una instancia de objeto:
		/**
		 * Crea una nueva instancia de un objeto de Salesforce
		 * @param  {String} name Nombre del objeto
		 * @return {Object}      Objeto de Salesforce instanciado
		 */
		InstanceNewObject(name){
			let objectDescription = this._getModel(name);
			return new this.SalesforceObject(this.connection, objectDescription);
		}

		/**
		 * Instancia un objeto de Salesforce con datos de un objeto ya existente
		 * @param  {String} name           	Nombre del objeto
		 * @param  {Object} existentObject 	Objeto con los campos de Salesforce definidos
		 * @return {Object} 				Objeto de Salesforce instanciado
		 */
		InstanceExistentObject(name, existentObject){
			let objectInstance = this.newObject(name);
			//Añadimos a esta nueva instancia, el objeto que nos han pasado
			for (let key in existentObject){
				objectInstance[key] = existentObject[key];
			}
			//Retornamos el objeto instanciado
			return objectInstance;
		}

		/**
		 * Obtiene un modelo concreto
		 * @param  {String} name Nombre del modelo a obtener
		 * @return {Object}      Descripción del modelo
		 */
		_getModel(name){
			//Iteramos los modelos existentes
			for (let i in this.models){
				//Recopilamos datos
				let model = this.models[i];

				if (model.name === name){
					return model;
				}
			}

			return null;
		}
	}

	module.exports = SalesforceORM;
})();