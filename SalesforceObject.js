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
		 * Asigna el valor de los campos del objeto a los que se encuentran en Salesforce
		 */
		get(){
			//Generamos la promesa a devolver
			let promise = this.Q.defer();

			//Preparación de la conexión
			this.connection.prepare(()=>{
				//Obtenemos la query a realizar
				const query = this._getSelectQuery();
			});

			//Retornamos la promesa
			return promise.promise; 
		}

		/**
		 * Calcula la query de selección estándar del propio objeto
		 * @return {String} Sentencia SOQL
		 */
		_getSelectQuery(){
			//Generamos la query estándar de select
			const query = `SELECT ${this.objectFields.join(', ')} FROM ${this.objectName} WHERE Id = ${this.Id} AND IsDeleted = FALSE`;
			
			return query;
		}

		/**
		 * Actualiza el objeto en Salesforce
		 */
		update(){

		}

		/**
		 * Elimina el objeto de Salesforce
		 */
		remove(){

		}
	}


	module.exports = SalesforceObject;
})();