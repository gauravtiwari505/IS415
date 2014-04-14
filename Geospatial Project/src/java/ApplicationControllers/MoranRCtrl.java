/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package ApplicationControllers;

import javax.servlet.ServletException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.lang.*;
import java.io.*;
import java.util.*;
import org.rosuda.REngine.*;
import org.rosuda.REngine.Rserve.RConnection;
import org.rosuda.REngine.Rserve.RserveException;
import RServeDocuments.StartRserve;
import au.com.bytecode.opencsv.CSVReader;
import au.com.bytecode.opencsv.CSVWriter;
import org.json.*;

/**
 *
 * @author xanth88
 */
public class MoranRCtrl extends HttpServlet {

    /**
     * Processes requests for both HTTP
     * <code>GET</code> and
     * <code>POST</code> methods.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("text/html;charset=UTF-8");
        response.setContentType("text/html;charset=UTF-8");
        PrintWriter out = response.getWriter();
        RConnection c;

        // The temporary file the uploaded .csv file is saved to before entering into the DB.
        String tempFilePath = getServletContext().getRealPath("");
        String tempFilePathR = tempFilePath.replaceAll("\\\\", "//");//
        String metaDataFilePath = tempFilePath + "\\metaData.csv";
        String moranOutputPath = tempFilePath + "\\moranResults.csv";
        String gearyOutPutPath = tempFilePath + "\\gearyResults.csv";
        tempFilePath = tempFilePath + "\\tempLoadedData.csv";

        //String shpFilePathR = tempFilePathR;tempFilePathR.substring(0, tempFilePathR.length()-10) + 
        String shpFilePathR = tempFilePathR + "//geoShapeData//geoShapeData.shp";
        String moranOutputPathR = tempFilePathR + "//moranResults.csv";
        String gearyOutputPathR = tempFilePathR + "//gearyResults.csv";
        tempFilePathR = tempFilePathR + "//tempLoadedData.csv";
        String isQueen = "FALSE";
        boolean isMoran = true;

        if(request.getParameter("contiguity").equals("queen")){
           isQueen = "TRUE";
        }
        if(request.getParameter("analysis").equals("geary")){
           isMoran = false;
        }




        try {
            System.out.println("result=" + StartRserve.checkLocalRserve());
            try {
                c = new RConnection();
             //   c.setStringEncoding("utf8");
                
                // REngine is the backend-agnostic API -- using eng instead of c makes sure that we don't use Rserve extensions inadvertently
                // REngine eng = (REngine) c;

                if (request.getParameter("action").equals("MoransProcessing")) {
                    File tempFile = new File(moranOutputPath);
                    tempFile.delete();
                   
                    c.voidEval("library(maptools)");
                   c.voidEval("library(rgdal)");
                    c.voidEval("library(spdep)");

                    c.voidEval("vnm_sp = readShapeSpatial('" + shpFilePathR + "',ID=\"FIPS_CNTRY\", CRS('+proj=longlat +datum=WGS84'))");
                    c.voidEval("vnminc = read.csv('" + tempFilePathR + "',header=TRUE, sep=\",\")");
                    c.voidEval("vnm_sp@data=data.frame(vnm_sp@data, vnminc[match(vnm_sp$FIPS_CNTRY,vnminc$FIPS_CNTRY),])");
                    
          
                    c.voidEval("vnm_cnq <- poly2nb(vnm_sp, queen =" + isQueen +")");
                    c.voidEval("vnm_cnq_rsw <- nb2listw(vnm_cnq,zero.policy=TRUE)");
                    c.voidEval("fips <- order(vnm_sp$FIPS_CNTRY)");
                    
                  //  c.voidEval("nclocI <- localmoran(vnm_sp$IMS1990, vnm_cnq_rsw, zero.policy=TRUE, na.action = na.pass)");
                  // c.voidEval("nci <- moran.plot(vnm_sp$IMS1990, vnm_cnq_rsw, labels=as.character(vnm_sp$FIPS_CNTRY), xlab=\"Country\", ylab=\"Migrant\", zero.policy = TRUE, na.action = na.pass)");
                // plot graph using jFreeChart
               // c.voidEval("lmG <- data.frame(nclocI[fips,], row.names=vnm_sp$FIPS_CNTRY[fips])");               
                    c.voidEval("dataVar = names(vnminc)");
                    int varListSize = c.eval("length(dataVar)").asInteger();

                    JSONArray csvArrayObj1 = new JSONArray();                    
                    JSONObject output = new JSONObject();


                  // reader = new CSVReader(new FileReader(metaDataFilePath));
                //    List metadataRows = reader.readAll();

  
                    c.voidEval("tempFrame = data.frame(FIPS_CNTRY=vnm_sp$FIPS_CNTRY)");

                    
                    JSONObject globalMoranObject = new JSONObject();
                    JSONObject tempObj;
                   // JSONObject tempObj2; 
                    //create variables for Moran Result
                  if(isMoran){
                    for (int i = 1; i <= varListSize; i++) {
                        //System.out.println("|||||||||" + "migrationVar["+i+"]" + "||||||||||");
                        String variable = c.eval("dataVar[" + i + "]").asString();
                        
                        if (!variable.equals("FIPS_CNTRY")&&!variable.equals("CNTRY_NAME")&& !variable.equals("FIPS_CNTRY.1 ") && !variable.equals("COUNTRY") && !variable.equals("Country") ) {
                            //set cells with no values to zero
                            c.voidEval("vnm_sp$" + variable+ "[is.na(vnm_sp$" + variable + ")] <- 0");

             
                            
                            tempObj = new JSONObject();
                            c.voidEval("globalMoran = moran.test(as.numeric(vnm_sp$" + variable + "), vnm_cnq_rsw, zero.policy = TRUE, na.action = na.pass)");
                            tempObj.put("globalMoran",c.eval("globalMoran$estimate[1]").asDouble());
                            tempObj.put("globalMoranSig",c.eval("globalMoran$p.value").asDouble());
                            globalMoranObject.put(variable,tempObj);      
                            c.voidEval("nclocI = localmoran(as.numeric(vnm_sp$" + variable + "), vnm_cnq_rsw,zero.policy=TRUE, na.action = na.pass )");
                            c.voidEval("lmi = data.frame(nclocI[fips,], row.names=vnm_sp$FIPS_CNTRY[fips])");
                            c.voidEval("laggedVal = lag(vnm_cnq_rsw,as.numeric(vnminc$" + variable + "),zero.policy = TRUE, NAOK = TRUE)");
                            c.voidEval("tempFrame$" + variable + "_lagged = laggedVal");
                            c.voidEval("tempFrame$" + variable + "_Ii = lmi$Ii");
                            c.voidEval("tempFrame$" + variable + "_Iisig = lmi$Pr.z...0.");
                          

                        }
                    }
                      c.voidEval("tempFrame[is.na(tempFrame)] <- 0");
                       c.voidEval("write.csv(tempFrame, file = \"" + moranOutputPathR + "\")");
                  }else{
                   //create results for geary c 
                    for (int i = 1; i <= varListSize; i++) {
                        String variable = c.eval("dataVar[" + i + "]").asString();
                        c.voidEval("vnm_sp$" + variable+ "[is.na(vnm_sp$" + variable + ")] <- 0");

                        //System.out.println("|||||||||" + "migrationVar["+i+"]" + "||||||||||");
                        
                        
                        if (!variable.equals("FIPS_CNTRY")&&!variable.equals("CNTRY_NAME")&& !variable.equals("FIPS_CNTRY.1 ") && !variable.equals("COUNTRY") && !variable.equals("Country") ) {
              
                            
                          tempObj= new JSONObject();
                         c.voidEval("globalMoran <- geary.test(as.numeric(vnm_sp$" + variable + "), listw=vnm_cnq_rsw,zero.policy=TRUE, adjust.n = TRUE)");
                          tempObj.put("globalGeary",c.eval("globalMoran$estimate[1]").asDouble());
                          tempObj.put("globalGeary",c.eval("globalMoran$p.value").asDouble());
                          globalMoranObject.put(variable,tempObj);      
                         // c.voidEval("a=geary(as.numeric(vnm_sp$" + variable + "),vnm_cnq_rsw,length(vnm_cnq_rsw),length(vnm_cnq_rsw)-1,Szero(vnm_cnq_rsw),zero.policy=TRUE)"); 
                         // c.voidEval("set.seed(1234)");
                          //c.voidEval("bperm=geary.mc(as.numeric(vnm_sp$" +  variable + "), listw=vnm_cnq_rsw, nsim=999,zero.policy=TRUE)");
                          //c.voidEval("mean(bperm$res[1:999])");
                         // c.voidEval("var(bperm$res[1:999])");
                        //  c.voidEval("summary(bperm$res[1:999])");  
                          c.voidEval("nclocG <- localG(as.numeric(vnm_sp$" + variable + "),listw =vnm_cnq_rsw,zero.policy=TRUE)");
                          c.voidEval("lmG = data.frame(nclocG[fips], row.names=vnm_sp$FIPS_CNTRY[fips])");
                          c.voidEval("laggedVal = lag(vnm_cnq_rsw,as.numeric(vnminc$" + variable + "),zero.policy = TRUE, NAOK = TRUE)");
                          c.voidEval("tempFrame$" + variable + "_lagged = laggedVal");
                          c.voidEval("tempFrame$" + variable + "_Ii = lmG$Ii");
                          c.voidEval("tempFrame$" + variable + "_Iisig = lmG$Pr.z...0."); 

             
                        }
                    }
                    
                          c.voidEval("tempFrame[is.na(tempFrame)] <- 0");
                          c.voidEval("write.csv(tempFrame, file = \"" + moranOutputPathR + "\")");    

                  }

                    CSVReader reader = new CSVReader(new FileReader(tempFilePath));
                    List csvRows = reader.readAll();

                    reader = new CSVReader(new FileReader(moranOutputPath));
                    List moranCsvRows = reader.readAll();
                    
                    int numberOfCsvRows = csvRows.size();
                    String[] columnNames = (String[]) csvRows.get(0);
                    int numberOfColumns = columnNames.length;
                    List varStringArray = Arrays.asList(columnNames);

                    String[] moranColumnNames = (String[]) moranCsvRows.get(0);
                    int numberOfMoranColumns = moranColumnNames.length;
                   // List varStringArrayMoran = Arrays.asList(moranColumnNames);
                                  
                    

                    
                    
                    //JSONObject tempObj2 = new JSONObject();
                    String[] tempStringArray;
                    String[] tempStringArrayMoran;

                    try {
                        for (int i = 1; i < numberOfCsvRows; i++) {
                            tempObj = new JSONObject();
                            //tempObj2 = new JSONObject();
                            tempStringArray = (String[]) csvRows.get(i);
                            tempStringArrayMoran = (String[]) moranCsvRows.get(i);
                            for (int j = 0; j < numberOfColumns; j++) {
                                tempObj.put(columnNames[j], tempStringArray[j]);
                            }
                            for (int j = 2; j < numberOfMoranColumns; j++) {
                                tempObj.put(moranColumnNames[j], tempStringArrayMoran[j]);
                            }

                            csvArrayObj1.put(tempObj);
                            //csvArrayObj2.put(tempObj2);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }

                  /*  List varDescriptionArray;
                    String[] descTempArr = new String[numberOfColumns];
                    int tempIndex = -1;
                    for (int i = 0; i < metadataRows.size(); i++) {
                        tempStringArray = (String[]) metadataRows.get(i);
                        tempIndex = varStringArray.indexOf(tempStringArray[0]);
                        if (tempIndex > -1 && tempStringArray.length > 1) {
                            descTempArr[tempIndex] = tempStringArray[1];
                        }
                    }*/

                   // varDescriptionArray = Arrays.asList(descTempArr);

                    try {
                        output.put("csvData", csvArrayObj1);
                        //output.put("moranCsvData", csvArrayObj2);
                        output.put("variableHeaders", varStringArray);
                       // output.put("variableDescriptions", varDescriptionArray);
                        output.put("globalMoran", globalMoranObject);
                        
                    } catch (Exception e) {
                        e.printStackTrace();
                    }

                    out.print(output);

                } else {
                    System.out.println("Request not recognized");
                }

                c.shutdown();

                } catch (RserveException rse) {
                System.out.println(rse);
                //c.shutdown();
            } catch (Exception x) {
                x.printStackTrace();
                //c.shutdown();
            };

        } finally {
            out.close();
        }
    }

    // <editor-fold defaultstate="collapsed" desc="HttpServlet methods. Click on the + sign on the left to edit the code.">
    /**
     * Handles the HTTP
     * <code>GET</code> method.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        processRequest(request, response);
    }

    /**
     * Handles the HTTP
     * <code>POST</code> method.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        processRequest(request, response);
    }

    /**
     * Returns a short description of the servlet.
     *
     * @return a String containing servlet description
     */
    @Override
    public String getServletInfo() {
        return "Short description";
    }// </editor-fold>
}
    