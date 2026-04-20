package com.pw.edu.pl.master.thesis.project.exceptions;

import org.springframework.http.HttpStatus;

public class DuplicateProjectKeyException extends CustomException {
    public DuplicateProjectKeyException(String message) {
        super(message, HttpStatus.CONFLICT);
    }
}
