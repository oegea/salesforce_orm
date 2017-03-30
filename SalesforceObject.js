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
		 * Asigna el valor de los campos del objeto a los que se encuentran en Salesforce
		 * @return {Object} Promesa resuelta al finalizar la consulta
		 */
		get(){
			return this._prepareConnection(this._onGetPrepare);
		}

		/**
		 * Recibe el resultado haber preparado la conexión para realizar un get
		 * @param  {Object} promise Promesa a resolver una vez finalice la operación get
		 */
		_onGetPrepare(promise){
			//Obtenemos la query a realizar
			const query = this._getSelectQuery();
			const formattedQuery = this.connection.soapSalesforce.FormatQuery(query);

			//Lanzamos la query
			this.connection.soapClient.queryAll(formattedQuery, this._onGet.bind(this, promise));
		}

		/**
		 * Recibe el resultado de haber obtenido un objeto Salesforce
		 * @param  {Object} promise Promesa a resolver tras procesar el resultado
		 * @param  {Object} error   Posibles errores ocurridos durante la operación get
		 * @param  {Object} result  Registros que coinciden con la operación get
		 */
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
		 * Crea el objeto como registro en Salesforce
		 * @return {Object} Promesa a resolver tras finalizar la operación create
		 */
		create(){
			return this._prepareConnection(this._onCreatePrepare);
		}

		/**
		 * Resultado de haber preparado la conexión con Salesforce antes de crear registros
		 * @param  {Object} promise Promesa a resolver una vez se haya creado el registro en Salesforce
		 */
		_onCreatePrepare(promise){
			let objectValues = this._getObjectValues();
			let formattedObject = this.connection.soapSalesforce.FormatObject(objectValues, this.objectName);
			this.connection.soapClient.create({sObjects: [objectValues]}, this._onCreate.bind(this, promise));
		}

		/**
		 * Recibe el resultado de finalizar una operación create
		 * @param  {Object} promise Promesa a resolver al finalizar
		 * @param  {Object} error   Posibles errores ocurridos durante la operación create
		 * @param  {Object} result  Registros creados durante la operación
		 */
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
		 * @return {Object} Promesa resuelta al finalizar el update
		 */
		update(){
			return this._prepareConnection(this._onUpdatePrepare);
		}

		/**
		 * Recibe el resultado de preparar la conexión para realizar un update
		 * @param  {Object} promise Promesa resuelta al finalizar el update
		 */
		_onUpdatePrepare(promise){
			let objectValues = this._getObjectValues();
			let formattedObject = this.connection.soapSalesforce.FormatObject(objectValues, this.objectName);
			this.connection.soapClient.update({sObjects: [objectValues]}, this._onUpdate.bind(this, promise));
		}

		/**
		 * Resultado de realizar una actualización
		 * @param  {Object} promise Promesa resuelta al finalizar el update
		 * @param  {Object} error   Posibles errores ocurridos durante la actualización
		 * @param  {Object} result  Resultado del update
		 */
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
		 * @return {Object} Promesa a resolver al finalizar el borrado
		 */
		remove(){
			return this._prepareConnection(this._onRemovePrepare);
		}

		/**
		 * Recibe el resultado de haber establecido la conexión con Salesforce antes de realizar el borrado
		 * @param  {Object} promise Promesa a resolver tras finalizar el borrado
		 */
		_onRemovePrepare(promise){
			this.connection.soapClient.delete({ids: [this.Id]}, this._onRemove.bind(this, promise));
		}

		/**
		 * Recibe el resultado de haber realizado el borrado de un registro
		 * @param  {Object} promise Promesa a resolver tras finalizar la operación
		 * @param  {Object} error   Posibles errores ocurridos durante el borrado
		 * @param  {Object} result  Resultado de borrar registros
		 */
		_onRemove(promise, error, result){
			this.Id = null;
			promise.resolve();
		}

		/**
		 * Obtiene un objeto javascript con los campos y valores que tiene esta instancia de SalesforceObject
		 * @return {Object} Objeto con los campos y valores registrados en este objeto
		 */
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