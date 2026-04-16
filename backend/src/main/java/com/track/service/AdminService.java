package com.track.service;

import com.track.domain.model.Company;
import com.track.domain.model.User;
import com.track.domain.repository.CompanyRepository;
import com.track.domain.repository.CompanyUserRepository;
import com.track.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final CompanyUserRepository companyUserRepository;

    @Transactional(readOnly = true)
    public Page<User> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public List<Company> getAllCompanies() {
        return companyRepository.findAll();
    }

    @Transactional
    public User blockUser(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setActive(false);
        return userRepository.save(user);
    }

    @Transactional
    public User unblockUser(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setActive(true);
        return userRepository.save(user);
    }

    @Transactional
    public User updateUser(UUID userId, String firstName, String lastName, String email) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (firstName != null) user.setFirstName(firstName);
        if (lastName != null) user.setLastName(lastName);
        if (email != null && !email.equals(user.getEmail())) {
            if (userRepository.existsByEmail(email.toLowerCase())) {
                throw new IllegalArgumentException("Email already in use");
            }
            user.setEmail(email.toLowerCase());
        }
        return userRepository.save(user);
    }
}
