// Info Box
document.getElementById("InfoB").onclick = function() {document.getElementById("Info").style.display = "block";}
document.getElementsByClassName("infoclose")[0].onclick = function() {document.getElementById("Info").style.display = "none";}
window.onclick = function(event) {if (event.target == document.getElementById("Info")) {document.getElementById("Info").style.display = "none";}}

// Config Modal
document.getElementById("configbuttom").onclick = function() {document.getElementById("configmodal").style.display = "block";}
  document.getElementsByClassName("closeConfig")[0].onclick = function() {document.getElementById("configmodal").style.display = "none"}
  window.onclick = function(event) {if (event.target == document.getElementById("configmodal")) {document.getElementById("configmodal").style.display = "none"}
}
// Give Item
// document.getElementById("giveMENU").onclick = function() {document.getElementById("GIVEM").style.display = "block"}
// document.getElementsByClassName("closeG")[0].onclick = function() {document.getElementById("GIVEM").style.display = "none"}
// window.onclick = function(event) {if (event.target == document.getElementById("GIVEM")) {document.getElementById("GIVEM").style.display = "none"}}
