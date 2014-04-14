/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


window.onload = function(){
    $.ajax({
        url: './DataBaseCtrl',  
        data:{
            action:"pageLoad"
        },
        dataType: 'JSON',
        async: false,  
        success: function(data){
            var variableArray = data.VariableHeaders;
            var variableDesArray = data.VariableDescriptions;
            var variableTable = "";
            var varCount = 0;
            for(i=0;i<variableArray.length;i++){
                if(variableDesArray[i] == null){
                    variableDesArray[i] = "-";
                }
                variableTable = variableTable + "<tr class=\"paraEstimateRow\"><td class=\"ui-widget-content\">"+ variableArray[i] +"</td><td class=\"ui-widget-content\" >"+ variableDesArray[i] +"</td></tr>"
                varCount = i;
            }
            $('#variableSummary').html(variableTable);
            $('#variableCount').html(varCount-2);
            
            //console.log(data.shpFileExtensions);
            var fileExtensions = data.shpFileExtensions;            
            if(fileExtensions.indexOf("shp")>=0){
                $('#shpStatus').text("Uploaded");
                $('#shpStatus').css("color","green");
            }else{
                $('#shpStatus').text("Not uploaded");
                $('#shpStatus').css("color","red");
            }
            if(fileExtensions.indexOf("shx")>=0){
                $('#shxStatus').text("Uploaded");
                $('#shxStatus').css("color","green");
            }else{
                $('#shxStatus').text("Not uploaded");
                $('#shxStatus').css("color","red");
            }
            if(fileExtensions.indexOf("dbf")>=0){
                $('#dbfStatus').text("Uploaded");
                $('#dbfStatus').css("color","green");
            }else{
                $('#dbfStatus').text("Not uploaded");
                $('#dbfStatus').css("color","red");
            }
            if(fileExtensions.indexOf("csv")>=0){
                $('#csvStatus').text("Uploaded");
                $('#csvStatus').css("color","green");
            }else{
                $('#csvStatus').text("Not uploaded");
                $('#csvStatus').css("color","red");
            }
            if(fileExtensions.indexOf("shpctg")>=0){
                $('#shpctgStatus').text("Uploaded");
                $('#shpctgStatus').css("color","green");
            }else{
                $('#shpctgStatus').text("Not uploaded");
                $('#shpctgStatus').css("color","red");
            }
            if(fileExtensions.indexOf("xml")>=0){
                $('#xmlStatus').text("Uploaded");
                $('#xmlStatus').css("color","green");
            }else{
                $('#xmlStatus').text("Not uploaded");
                $('#xmlStatus').css("color","red");
            }                

            var urlQueryVal = getUrlVars();
            
            if(urlQueryVal["action"]=="csvUpload" || urlQueryVal["action"]=="metaDataUpload" || urlQueryVal["action"]=="shpUpload"){
                alert("File Successfully Uploaded");
            }
        }  
    });        
}

// Read a page's GET URL variables and return them as an associative array.
function getUrlVars()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}