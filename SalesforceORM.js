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
			this.connection = new this.SalesforceConnection(username, password, token, wsdl);

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
		

		/**
		 * Prepara la conexión con Salesforce antes de realizar ninguna operación
		 * @param  {Function} callback Función a ejecutar una vez se haya establecido la conexión
		 * @return {Object}            Promesa que será resuelta una vez la operación que estamos preparando finalice
		 */
		_prepareConnection(callback){
			//Generamos la promesa a devolver
			let promise = this.Q.defer();

			//Preparación de la conexión
			this.connection.prepare().then(callback.bind(this, promise));

			//Retornamos la promesa
			return promise.promise; 
		}

		/**
		 * Realiza una query a Salesforce
		 * @param  {String} query Sentencia SOQL
		 * @return {Object}       Promesa a devolver al finalizar la sentencia
		 */
		query(query){
			return this._prepareConnection(this.__onPrepareQuery.bind(this, query));
		}

		/**
		 * Recibe el resultado de comprobar la conexión con SOAP API antes de realizar la consulta a Salesforce
		 * @param  {String} query   Sentencia a ejecutar
		 * @param  {Object} promise Promesa a resolver al finalizar la query
		 */
		__onPrepareQuery(query, promise){
			let formattedQuery = this.connection.soapSalesforce.FormatQuery(query);

			this.connection.soapClient.queryAll(formattedQuery, this._onQuery.bind(this, promise));
		}

		/**
		 * Recibe el resultado de la query, y la retorna al resolver la promesa
		 * @param  {Object} promise Promesa a resolver
		 * @param  {Object} error   Posibles errores ocurridos durante la ejecución de la query
		 * @param  {Object} result  Resultados retornados por la query
		 */
		_onQuery(promise, error, result){
			promise.resolve({error: error, result: result});
		}

		/**
		 * Escapa un texto para poder ser insertado en una sentencia SOQL
		 * @param  {String} textToEscape Texto a escapar
		 * @return {String}              Texto ya escapado
		 */
		escape(textToEscape){
			return this.connection.soapSalesforce.EscapeSOQL(textToEscape);
		}

		/**
		 * Empieza una búsqueda en Salesforce
		 * @param  {String} modelName    Nombre del modelo a utilizar en la búsqueda
		 * @param  {String} where        Cláusulas de filtrado (SOQL) a utilizar en la búsqueda
		 * @param  {Object} selectFields Campos adicionales que quieren recuperarse en la búsqueda
		 * @return {Object}              Promesa resuelta al finalizar la búsqueda
		 */
		search(modelName, where, selectFields){

			//Obtenemos la descripción del objeto
			const modelDescription = this._getModel(modelName);

			return this._prepareConnection(this._onPrepareSearch.bind(this, modelDescription, where, selectFields));
		}

		/**
		 * Recibe el resultado de preparar la conexión antes de empezar la búsqueda en Salesforce
		 * @param  {Object} modelDescription Nombre y campos del modelo sobre el que estamos buscando
		 * @param  {String} where            Cláusulas de búsqueda a incluir en la query de búsqueda
		 * @param  {Object} selectFields     Campos adicionales que quieren recuperarse en la búsqueda, además de los incluídos en la descripción del modelo
		 * @param  {Object} promise          Promesa a resolver al finalizar la búsqueda
		 */
		_onPrepareSearch(modelDescription, where, selectFields, promise){
			if (selectFields === undefined)
				selectFields = [];

			let query = this._getSearchQuery(modelDescription, where, selectFields);
			let formattedQuery = this.connection.soapSalesforce.FormatQuery(query);

			this.connection.soapClient.queryAll(formattedQuery, this._onSearch.bind(this, promise, modelDescription.name));
		}

		/**
		 * Recibe el resultado de una búsqueda
		 * @param  {Object} promise   Promesa a resolver al finalizar, indicando los registros que la búsqueda ha retornado
		 * @param  {String} modelName Nombre del modelo sobre el que estamos buscando
		 * @param  {Object} error     Posibles errores ocurridos durante la búsqueda
		 * @param  {Object} result    Registros y resultados de la búsqueda
		 */
		_onSearch(promise, modelName, error, result){
			try{
				//Des-encapsulamos el resultado
				result = result.result;
				//Si no ha habido éxito
				if (result.done !== true){
					//Rechazamos la promesa
					promise.reject();
				}else{
					
					//En esta variable guardaremos los registros que retornaremos en la promesa
					let readyResult = [];

					//Iteramos los registros que ha retornado la query
					for (let i in result.records){
						let recordInstance = this.instanceExistentObject(modelName, result.records[i]);
						readyResult.push(recordInstance);
					}

					//Resolvemos la promesa
					promise.resolve(readyResult);
				}
			}catch(exception){
				promise.reject();
			}
			
		}

		/**
		 * Genera una query SOQL para realizar una búsqueda de un objeto
		 * @param  {Object} modelDescription       Nombre y campos del modelo sobre el que estamos buscando
		 * @param  {String} where                  Cláusulas de filtrado sobre las que queremos realizar la búsqueda
		 * @param  {Object} additionalSelectFields Campos adicionales, además de los del propio modelo, que queremos recuperar
		 * @return {String}                        Query SOQL a ejecutar para llevar a cabo la búsqueda
		 */
		_getSearchQuery(modelDescription, where, additionalSelectFields){
			//Generamos la query de búsqueda
			const query = `SELECT ${modelDescription.fields.join(', ')} ${additionalSelectFields.join(', ')} FROM ${modelDescription.name} WHERE ${where}`;
			return query;
		}
		
		//Crear una instancia de objeto:
		/**
		 * Crea una nueva instancia de un objeto de Salesforce
		 * @param  {String} name Nombre del objeto
		 * @return {Object}      Objeto de Salesforce instanciado
		 */
		instanceNewObject(name){
			let objectDescription = this._getModel(name);
			return new this.SalesforceObject(objectDescription, this.connection);
		}

		/**
		 * Instancia un objeto de Salesforce con datos de un objeto ya existente
		 * @param  {String} name           	Nombre del objeto
		 * @param  {Object} existentObject 	Objeto con los campos de Salesforce definidos
		 * @return {Object} 				Objeto de Salesforce instanciado
		 */
		instanceExistentObject(name, existentObject){
			let objectInstance = this.instanceNewObject(name);
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