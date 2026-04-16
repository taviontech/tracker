package com.track.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ContactService {

    private final EmailService emailService;

    @Value("${contact.recipient-email:support@trackerhub.com}")
    private String recipientEmail;

    public void send(String name, String email, String phone, String message) {
        emailService.sendContactEmail(recipientEmail, name, email, phone, message);
    }
}
