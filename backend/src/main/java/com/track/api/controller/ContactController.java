package com.track.api.controller;

import com.track.api.dto.ContactRequest;
import com.track.service.ContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;

    @PostMapping
    public ResponseEntity<?> contact(@Valid @RequestBody ContactRequest req) {
        contactService.send(req.name(), req.email(), req.phone(), req.message());
        return ResponseEntity.ok(Map.of("message", "Message sent"));
    }
}
