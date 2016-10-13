uuid = require('uuid');

//http://localhost:3000/RTU/SimROB7/services/LoadPallet
// OPerations dictionary for robot and conveyors. Used to simplify the life
// when creating recipe
var opDict = {
  robot: {
    frames: {
      frame1: "/RTU/SimROB2/services/Draw1",
      frame2: "/RTU/SimROB2/services/Draw2",
      frame3: "/RTU/SimROB2/services/Draw3"
    },
    screens: {
      screen1: "/RTU/SimROB2/services/Draw4",
      screen2: "/RTU/SimROB2/services/Draw5",
      screen3: "/RTU/SimROB2/services/Draw6"
    },
    keyboards: {
      keyboard1: "/RTU/SimROB2/services/Draw7",
      keyboard2: "/RTU/SimROB2/services/Draw8",
      keyboard3: "/RTU/SimROB2/services/Draw9"
    },
    pallet: {
      loadPallet: "/RTU/SimROB7/services/LoadPallet",
      unloadPallet: "/RTU/SimROB7/services/UnloadPallet"
    },
    paper: {
      loadPaper: "/RTU/SimROB1/services/LoadPaper",
      unloadPaper: "/RTU/SimROB1/services/UnloadPaper"
    }
  },
  conveyor: {
    cnv7First: { //from pallet loading to end of station 7
      steps: ["/RTU/SimCNV7/services/TransZone35"]
    },
    // to not repeat bypass route for all conveyors this generator may be used
    cnvAnyBypass: {
      steps: function (id){
        if( id < 2 || id > 12  || id === 7 ){
          console.err( "Wrong id!" );
          return null;
        }
        var op1 = "/RTU/SimCNV"+id+"/services/TransZone14";
        var op2 = "/RTU/SimCNV"+id+"/services/TransZone45";
        return [op1, op2];
      }
    },
    cnv1First: {// from input to paper loading zone of station 1
      steps: ["/RTU/SimCNV1/services/TransZone12",
              "/RTU/SimCNV1/services/TransZone23"]
    },
    cnv1Last: { // from paper loading to the end zone of station 1
      steps: ["/RTU/SimCNV1/services/TransZone35"]
    },
    cnv2First: {// from input to drawing zone of station 2
      steps: ["/RTU/SimCNV2/services/TransZone12",
              "/RTU/SimCNV2/services/TransZone23"]
    },
    cnv2Last: {// from drawing zone to the end zone of station 2
      steps: ["/RTU/SimCNV2/services/TransZone35"]
    },
    cnv7Last: {// from input zone to pallet unloading zone of station 7
      steps: ["/RTU/SimCNV7/services/TransZone12",
              "/RTU/SimCNV7/services/TransZone23"]
    },
  }
}
/**
* @class a representation of the master recipe. It is applicable only to fastory
* line instances and can be customized to draw different shapes in the pallet
*
* @constructor has three arguments, all must be defined and in the opDict for
* the system ({frame|screen|keyboard}{1|2|3} e.g. screen3)
* @throws Bad parameters ERROR if parameter cannot be found in the dictionary
*/
var MasterRec = function ( frame, screen, keyboard ) {
  //checking if there is a need to throw exception
  if( (opDict.robot.frames[frame] === undefined)
      ||(opDict.robot.screens[screen] === undefined)
      ||(opDict.robot.keyboards[keyboard] === undefined) ){
        //if thrown execution flow is interrupted
      throw new Error("Bad parameters for MasterRec: " + frame + ", "+ screen + ", "+ keyboard);
    }

  // unique id
  this.id = "MasterRec-" + uuid.v4();

  // the process steps. The process steps is an array of strings representing
  // abstract actions. Array is easy to iterate throug, and to combine it i used
  // array concatenation (http://www.w3schools.com/jsref/jsref_concat_array.asp)

  // loading pallet
  this.steps = [opDict.robot.pallet.loadPallet];
  // leaving ws7
  this.steps = this.steps.concat(opDict.conveyor.cnv7First.steps);
  //ws8->ws9->ws10->ws11->ws12->ws1
  this.steps = this.steps.concat(opDict.conveyor.cnvAnyBypass.steps(8));
  this.steps = this.steps.concat(opDict.conveyor.cnvAnyBypass.steps(9));
  this.steps = this.steps.concat(opDict.conveyor.cnvAnyBypass.steps(10));
  this.steps = this.steps.concat(opDict.conveyor.cnvAnyBypass.steps(11));
  this.steps = this.steps.concat(opDict.conveyor.cnvAnyBypass.steps(12));
  // to paper laoding zone
  this.steps = this.steps.concat(opDict.conveyor.cnv1First.steps);
  // laod paper. note the operation is in [] as in dict it was not an array
  this.steps = this.steps.concat([opDict.robot.paper.loadPaper]);
  // leave ws1
  this.steps = this.steps.concat(opDict.conveyor.cnv1Last.steps);
  // to drawing zone
  this.steps = this.steps.concat(opDict.conveyor.cnv2First.steps);
  // add all drawings
  this.steps = this.steps.concat([opDict.robot.frames[frame],
                                  opDict.robot.screens[screen],
                                  opDict.robot.keyboards[keyboard]]);
  // leave ws2
  this.steps = this.steps.concat(opDict.conveyor.cnv2Last.steps);
  //ws3->ws4->ws5->ws6->ws7
  this.steps = this.steps.concat(opDict.conveyor.cnvAnyBypass.steps(3));
  this.steps = this.steps.concat(opDict.conveyor.cnvAnyBypass.steps(4));
  this.steps = this.steps.concat(opDict.conveyor.cnvAnyBypass.steps(5));
  this.steps = this.steps.concat(opDict.conveyor.cnvAnyBypass.steps(6));
  //to pallet unloading zone
  this.steps = this.steps.concat(opDict.conveyor.cnv7Last.steps);
  // unload
  this.steps = this.steps.concat([opDict.robot.pallet.unloadPallet]);
  // done!
}

module.exports = MasterRec;
