package com.track.service;

import com.track.domain.model.Company;
import com.track.domain.model.CompanyUser;
import com.track.domain.model.User;
import com.track.domain.repository.CompanyRepository;
import com.track.domain.repository.CompanyUserRepository;
import com.track.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final CompanyUserRepository companyUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public User getProfile(UUID userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @Transactional
    public User updateProfile(UUID userId, String firstName, String lastName, String phone, String avatarUrl) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (firstName != null) user.setFirstName(firstName.strip());
        if (lastName != null) user.setLastName(lastName.strip());
        if (phone != null) user.setPhone(phone.strip());
        if (avatarUrl != null) user.setAvatarUrl(avatarUrl);
        return userRepository.save(user);
    }

    @Transactional
    public void updateCompanyName(UUID userId, UUID companyId, String name) {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("Company name cannot be blank");
        CompanyUser cu = companyUserRepository.findByCompanyIdAndUserId(companyId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Not a member of this company"));
        if (cu.getRole() != CompanyUser.CompanyRole.OWNER) {
            throw new IllegalArgumentException("Only OWNER can rename the company");
        }
        Company company = companyRepository.findById(companyId)
            .orElseThrow(() -> new IllegalArgumentException("Company not found"));
        company.setName(name.strip());
        companyRepository.save(company);
    }

    @Transactional
    public void changePassword(UUID userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
