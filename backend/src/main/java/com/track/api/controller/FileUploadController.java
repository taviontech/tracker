package com.track.api.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/files")
public class FileUploadController {

    @Value("${uploads.dir:/app/uploads}")
    private String uploadsDir;

    @Value("${api.base-url:http://localhost:8080}")
    private String apiBaseUrl;

    @PostMapping("/upload")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) {
        try {
            Path dir = Paths.get(uploadsDir);
            Files.createDirectories(dir);

            String originalName = file.getOriginalFilename();
            String ext = originalName != null && originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf(".")) : "";
            String filename = UUID.randomUUID() + ext;

            Path dest = dir.resolve(filename);
            file.transferTo(dest.toFile());

            String url = apiBaseUrl + "/uploads/" + filename;
            return ResponseEntity.ok(Map.of("url", url, "fileName", originalName != null ? originalName : filename));
        } catch (IOException e) {
            log.error("File upload failed", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Upload failed"));
        }
    }
}
