(() =>{

	'use strict';

	/**
	 * Instancia de un objeto de Salesforce
	 */
	class SalesforceObject{
		/**
		 * Inicializa la instancia de objeto
		 * @param  {Object} objectDescription 		Descripción del objeto a instanciar, nombre y campos
		 * @param  {Object} salesforceConnection 	Conexión al SOAP API de Salesforce
		 */
		constructor (objectDescription, salesforceConnection){
			//Librerías requeridas
			this.Q = require('q');

			//Recopilamos datos
			this.connection   = salesforceConnection;
			this.objectName   = objectDescription.name;
			this.objectFields = objectDescription.fields;
		}

		_prepareConnection(callback){
			//Generamos la promesa a devolver
			let promise = this.Q.defer();

			//Preparación de la conexión
			this.connection.prepare().then(callback.bind(this, promise));

			//Retornamos la promesa
			return promise.promise; 
		}

		/**
		 * Asigna el valor de los campos del objeto a los que se encuentran en Salesforce
		 * @return {Object} Promesa resuelta al finalizar la consulta
		 */
		get(){
			return this._prepareConnection(this._onGetPrepare);
		}

		_onGetPrepare(promise){
			//Obtenemos la query a realizar
			const query = this._getSelectQuery();
			const formattedQuery = this.connection.soapSalesforce.FormatQuery(query);

			//Lanzamos la query
			this.connection.soapClient.queryAll(formattedQuery, this._onGet.bind(this, promise));
		}

		_onGet(promise, error, result){
			try{
				let record = result.result.records[0];
				for (let key in record){

					if (key === 'attributes')
						continue;

					this[key] = record[key];
				}

				promise.resolve();
			}catch(exception){
				promise.reject();
			}
			
		}

		/**
		 * Calcula la query de selección estándar del propio objeto
		 * @return {String} Sentencia SOQL
		 */
		_getSelectQuery(){
			//Generamos la query estándar de select
			const query = `SELECT ${this.objectFields.join(', ')} FROM ${this.objectName} WHERE Id = '${this.Id}' AND IsDeleted = FALSE`;
			
			return query;
		}

		/**
		 * Crea el registro en Salesforce
		 */
		create(){
			return this._prepareConnection(this._onCreatePrepare);
		}

		_onCreatePrepare(promise){
			let objectValues = this._getObjectValues();
			let formattedObject = this.connection.soapSalesforce.FormatObject(objectValues, this.objectName);
			this.connection.soapClient.create({sObjects: [objectValues]}, this._onCreate.bind(this, promise));
		}

		_onCreate(promise, error, result){
			try{
				this.Id = result.result[0].id;
				promise.resolve();
			}catch(exception){
				promise.reject();
			}
		}

		/**
		 * Actualiza el objeto en Salesforce
		 */
		update(){
			return this._prepareConnection(this._onUpdatePrepare);
		}

		_onUpdatePrepare(promise){
			let objectValues = this._getObjectValues();
			let formattedObject = this.connection.soapSalesforce.FormatObject(objectValues, this.objectName);
			this.connection.soapClient.update({sObjects: [objectValues]}, this._onUpdate.bind(this, promise));
		}

		_onUpdate(promise, error, result){
			try{
				this.Id = result.result[0].id;
				promise.resolve();
			}catch(exception){
				promise.reject();
			}
		}

		/**
		 * Elimina el objeto de Salesforce
		 */
		remove(){
			return this._prepareConnection(this._onRemovePrepare);
		}

		_onRemovePrepare(promise){
			this.connection.soapClient.delete({ids: [this.Id]}, this._onRemove.bind(this, promise));
		}

		_onRemove(promise, error, result){
			this.Id = null;
			promise.resolve();
		}

		_getObjectValues(){
			let fieldsValues = {};
			//Iteramos los campos
			for (let i in this.objectFields){
				let field = this.objectFields[i];
				fieldsValues[field] = this[field];
			}

			return fieldsValues;
		}
	}


	module.exports = SalesforceObject;
})();