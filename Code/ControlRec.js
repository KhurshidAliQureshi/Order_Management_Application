/**
*
* @class ControlRec repesents the control recipe
* @constructor Accepts two arguments: MasterRecipe and a System description
* @param {MasterRec} master is a master recipe, including an array of abstract
*                    steps which can be executed on any instance of the Fastory
*                    listener
* @param {Object} system is a system description. Must have a baseUrl string
*                 a base url to the system. e.g. http://localhost:3000
*/
var ControlRec = function (master, system) {
  this.id = "ControlRec-" + uuid.v4(); // generating ID
  this.poid = system.poid;				//ADDED BY ME.
  this.steps = master.steps.slice(); //copying steps
  for (step in this.steps) { //making executable steps adding baseUrl to steps
    this.steps[step] = system.baseUrl + this.steps[step];
	//this.steps[step] = "http://localhost:3000" + this.steps[step];
  }
}

/**
* This method generates the details to service execution for certain step of the
* process. The details include the service URL and callback postfix, including
* control recipe id and the next step number. For the last operation returns the
* "done" instead of the next step number.
*
* @param {Integer|ParsableInteger} id - the id of the step to be executed
*
* @returns {Obejct} - the service execution details: including service url and
* callback postfix:
* {url: "http://example.com/test", callback: "id-34-234-324/4"}
*/
ControlRec.prototype.executeStep = function (id) {
  var result = {
    url: this.steps[id]
  }
/* Here is the problem we ecnoutered last time variable id was not 1 but "1"
in js "1" + 1 = "11" - as the operation + is concat for string
*/
  var next = parseInt(id) + 1;
  // create the postfix for callback concatingthe ControlRec id and next step id
  // If next step exists put its id to callback postfix
  if (this.steps[next]){
    result.callback = this.id + '/' + next;
  } else { // in does not exist - put done id to callback postfix
    result.callback = this.id + '/done';
  }

  return result;
};

//letting others know about the ControlRec
module.exports = ControlRec;
