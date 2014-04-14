/*
 * 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package ApplicationControllers;

import java.io.*;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.*;
import java.util.zip.*;
import java.lang.*;
import org.json.*;
import au.com.bytecode.opencsv.*;
import javax.servlet.RequestDispatcher;
import org.apache.commons.io.*;
import org.apache.commons.fileupload.*;
import org.apache.commons.fileupload.disk.*;
import org.apache.commons.fileupload.servlet.*;

/**
 *
 * @author xanth88
 */
@WebServlet(name = "DataBaseCtrl", urlPatterns = {"/DataBaseCtrl"})
public class FileAccessCtrl extends HttpServlet {

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
        PrintWriter out = response.getWriter();

        // The temporary file the uploaded .csv file is saved to before entering into the DB.
        String tempFilePath = getServletContext().getRealPath("");
        String metaDataFilePath = tempFilePath + "\\metaData.csv";
        String zipFilePath = tempFilePath + "\\geoShapeData.zip";
        String shapeFolderPath = tempFilePath + "\\geoShapeData";
        tempFilePath = tempFilePath + "\\tempLoadedData.csv";

        // Retrieve info for the current .csv file
        if (request.getParameter("action").equals("visualize")) {
            
            JSONArray csvArrayObj1 = new JSONArray();
            JSONObject output = new JSONObject();
            CSVReader reader = new CSVReader(new FileReader(tempFilePath));
            List csvRows = reader.readAll();

            reader = new CSVReader(new FileReader(metaDataFilePath));
            List metadataRows = reader.readAll();

            int numberOfCsvRows = csvRows.size();
            String[] columnNames = (String[]) csvRows.get(0);
            int numberOfColumns = columnNames.length;
            List varStringArray = Arrays.asList(columnNames);

            JSONObject tempObj = new JSONObject();
            String[] tempStringArray;

            try {
                for (int i = 1; i < numberOfCsvRows; i++) {
                    tempObj = new JSONObject();
                    tempStringArray = (String[]) csvRows.get(i);
                    for (int j = 0; j < numberOfColumns; j++) {
                        tempObj.put(columnNames[j], tempStringArray[j]);
                    }
                    csvArrayObj1.put(tempObj);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }

            List varDescriptionArray;
            String[] descTempArr = new String[numberOfColumns];
            int tempIndex = -1;
            for (int i = 0; i < metadataRows.size(); i++) {
                tempStringArray = (String[]) metadataRows.get(i);
                tempIndex = varStringArray.indexOf(tempStringArray[0]);
                if (tempIndex > -1 && tempStringArray.length > 1) {
                    descTempArr[tempIndex] = tempStringArray[1];
                }
            }

            varDescriptionArray = Arrays.asList(descTempArr);

            try {
                output.put("csvData", csvArrayObj1);
                output.put("variableHeaders", varStringArray);
                output.put("variableDescriptions", varDescriptionArray);
            } catch (Exception e) {
                e.printStackTrace();
            }

            out.print(output);

        } else if (request.getParameter("action").equals("pageLoad")) {

            JSONObject obj1 = new JSONObject();
            CSVReader reader;
            List varDescriptionArray = new ArrayList();
            List varStringArray = new ArrayList();
            
            try {
                reader = new CSVReader(new FileReader(tempFilePath));
                List csvRows = reader.readAll();
          

           
                int numberOfCsvRows = csvRows.size();
                String[] columnNames = (String[]) csvRows.get(0);
                int numberOfColumns = columnNames.length;
                varStringArray = Arrays.asList(columnNames);
                
                
                
                reader = new CSVReader(new FileReader(metaDataFilePath));
                List metadataRows = reader.readAll();
                
                String[] descTempArr = new String[numberOfColumns];
                int tempIndex = -1;
                String[] tempStringArray;
                for (int i = 0; i < metadataRows.size(); i++) {
                    tempStringArray = (String[]) metadataRows.get(i);
                    tempIndex = varStringArray.indexOf(tempStringArray[0]);
                    if (tempIndex > -1 && tempStringArray.length > 1) {
                        descTempArr[tempIndex] = tempStringArray[1];
                    }
                }

                varDescriptionArray = Arrays.asList(descTempArr);
            } catch (Exception e) {
                e.printStackTrace();
            }
            
            File shapeFileFolder = new File(shapeFolderPath);
            List fileStringArray = new ArrayList();
            if (shapeFileFolder.exists()) {
                String[] fileNameArray = shapeFileFolder.list();
                for (int i = 0; i < fileNameArray.length; i++) {
                    fileStringArray.add(fileNameArray[i].split("\\.")[1]);
                }
            }

            try {
                obj1.put("VariableHeaders", varStringArray);
                obj1.put("VariableDescriptions", varDescriptionArray);
                obj1.put("shpFileExtensions", fileStringArray);
            } catch (Exception e) {
                e.printStackTrace();
            }

            out.print(obj1);

        } else if (request.getParameter("action").equals("csvUpload")) {
            // It is an csv upload request. Upload csv file.

            try {
                // Create a factory for disk-based file items
                FileItemFactory factory = new DiskFileItemFactory();

                // Create a new file upload handler
                ServletFileUpload upload = new ServletFileUpload(factory);

                // Parse the request
                List /* FileItem */ items = upload.parseRequest(request);

                // Process the uploaded items
                Iterator iter = items.iterator();
                while (iter.hasNext()) {
                    FileItem item = (FileItem) iter.next();

                    if (item.isFormField()) {
                        String name = item.getFieldName();
                        String value = item.getString();
                    } else {
                        String fieldName = item.getFieldName();
                        String fileName = item.getName();
                        String contentType = item.getContentType();
                        boolean isInMemory = item.isInMemory();
                        long sizeInBytes = item.getSize();

                        System.out.println(fileName);

                        File uploadedFile = new File(tempFilePath);
                        item.write(uploadedFile);
                    }
                }

            } catch (Exception e) {
                e.printStackTrace();
            }

            RequestDispatcher dispatcher = request.getRequestDispatcher("index.html");
            dispatcher.forward(request, response);

        } else if (request.getParameter("action").equals("shpUpload")) {

            // It is a shape file upload request. Upload shape file.

            try {
                // Create a factory for disk-based file items
                FileItemFactory factory = new DiskFileItemFactory();

                // Create a new file upload handler
                ServletFileUpload upload = new ServletFileUpload(factory);

                // Parse the request
                List /* FileItem */ items = upload.parseRequest(request);

                // Process the uploaded items
                Iterator iter = items.iterator();
                while (iter.hasNext()) {
                    FileItem item = (FileItem) iter.next();

                    if (item.isFormField()) {
                        String name = item.getFieldName();
                        String value = item.getString();
                    } else {
                        String fieldName = item.getFieldName();
                        String fileName = item.getName();
                        String contentType = item.getContentType();
                        boolean isInMemory = item.isInMemory();
                        long sizeInBytes = item.getSize();

                        System.out.println(fileName);

                        File uploadedFile = new File(zipFilePath);
                        item.write(uploadedFile);
                    }
                }

                byte[] buffer = new byte[1024];

                // Clear all contents in the .shp Folder
                File shapeFileFolder = new File(shapeFolderPath);
                if (!shapeFileFolder.exists()) {
                    shapeFileFolder.mkdir();
                }
                File[] files = shapeFileFolder.listFiles();
                if (files != null) { //some JVMs return null for empty dirs
                    for (File f : files) {
                        f.delete();
                    }
                }

                //get the zip file content
                ZipInputStream zis = new ZipInputStream(new FileInputStream(zipFilePath));
                //get the zipped file list entry
                ZipEntry ze = zis.getNextEntry();

                while (ze != null) {

                    String fileName = ze.getName();
                    String[] fileNameStrArray = fileName.split("\\.");
                    String newFileName;
                    if (fileNameStrArray.length == 2) {
                        newFileName = "geoShapeData." + fileNameStrArray[1];
                    } else {
                        newFileName = "geoShapeData." + fileNameStrArray[1] + fileNameStrArray[2];
                    }
                    File newFile = new File(shapeFolderPath + File.separator + newFileName);

                    System.out.println("file unzip path : " + newFileName);
                    System.out.println("file unzip : " + newFile.getAbsoluteFile());

                    //create all non exists folders
                    //else you will hit FileNotFoundException for compressed folder
                    new File(newFile.getParent()).mkdirs();

                    FileOutputStream fos = new FileOutputStream(newFile);

                    int len;
                    while ((len = zis.read(buffer)) > 0) {
                        fos.write(buffer, 0, len);
                    }

                    fos.close();
                    ze = zis.getNextEntry();
                }

                zis.closeEntry();
                zis.close();

            } catch (Exception e) {
                e.printStackTrace();
            }

            RequestDispatcher dispatcher = request.getRequestDispatcher("index.html");
            dispatcher.forward(request, response);

        } else {
            // It is an metadata file upload request. Upload metadata file.

            try {
                // Create a factory for disk-based file items
                FileItemFactory factory = new DiskFileItemFactory();

                // Create a new file upload handler
                ServletFileUpload upload = new ServletFileUpload(factory);

                // Parse the request
                List /* FileItem */ items = upload.parseRequest(request);

                // Process the uploaded items
                Iterator iter = items.iterator();
                while (iter.hasNext()) {
                    FileItem item = (FileItem) iter.next();

                    if (item.isFormField()) {
                        String name = item.getFieldName();
                        String value = item.getString();
                    } else {
                        String fieldName = item.getFieldName();
                        String fileName = item.getName();
                        String contentType = item.getContentType();
                        boolean isInMemory = item.isInMemory();
                        long sizeInBytes = item.getSize();

                        System.out.println(fileName);

                        File uploadedFile = new File(metaDataFilePath);
                        item.write(uploadedFile);
                    }
                }

            } catch (Exception e) {
                e.printStackTrace();
            }

            RequestDispatcher dispatcher = request.getRequestDispatcher("Step1.html");
            dispatcher.forward(request, response);
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
