(() => {
	'use strict';

	/**
	 * Gestiona la conexión con el SOAP API de Salesforce
	 */
	class SalesforceConnection{
		/**
		 * Inicializa el gestor de conexión con Salesforce
		 * @param  {String} username Usuario con el que conectarse
		 * @param  {String} password Password con el que conectarse
		 * @param  {String} token    Token de conexión
		 * @param  {String} wsdl     Ruta del fichero WSDL
		 */
		constructor(username, password, token, wsdl){
			//Dependencias
			this.SoapSalesforce = require('soap_salesforce');
			this.Q              = require('q');

			//Constantes
			this.MINUTES_MULTIPLIER = ((60)*1000);

			//Guardamos datos
			this.username = username;
			this.password = password;
			this.token    = token;
			this.wsdl     = wsdl;

			//Propiedades de la clase
			this.nextLoginStamp	  = 0;    //Timestamp a partir del cual necesitaremos re-logar. Las sesiones duran 120 minutos sin realizar consultas.
			this.soapClient       = null; //Contiene el cliente de SOAP

			//Instancias de clases
			this.soapSalesforce = new this.SoapSalesforce(username, password, token, wsdl);
		}

		/**
		 * Comprueba si hay que hacer login en Salesforce, y en caso afirmativo lo realiza
		 * @return {Object} Promesa retornada cuando el login de Salesforce ha finalizado
		 */
		prepare(){
			//Preparamos una promesa
			let promise = this.Q.defer();

			//Si no estamos conectados, conectamos
			if (!this._connectionStatus()){
				//Las sesiones caducan en 120 minutos, así que haremos relogin a los 100 minutos
				this.soapSalesforce.Login().then(this._onPrepare.bind(this, promise));
			}else{
				//Estamos conectados
				promise.resolve();		
			}

			//Retornamos la promesa
			return promise.promise;
		}

		/**
		 * Recibe el resultado de haber realizado login en Salesforce
		 * @param  {Object} promise    Promesa a resolver al finalizar el proceso
		 * @param  {Object} soapClient Cliente con el que ejecutamos peticiones al API SOAP
		 */
		_onPrepare(promise, soapClient){
			this.soapClient = soapClient;
			this.nextLoginStamp = Date.now()+(this.MINUTES_MULTIPLIER*100);
			promise.resolve();
		}

		/**
		 * Comprueba si es necesario realizar login en el API o no
		 * @return {Boolean} Verdadero cuando estamos conectados a Salesforce, y no es necesario hacer login.
		 */
		_connectionStatus(){
			//Si soapClient es null o el timestamp indica que es necesario reloguear, no estamos conectados
			if (soapClient === null || nextLoginStamp <= new Date.now()){
				return false;
			}else{
				return true;
			}
		}
	}

	module.exports = SalesforceConnection;
})();
