package com.example.EduAid;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EduAidApplication {

	public static void main(String[] args) {
		SpringApplication.run(EduAidApplication.class, args);
	}

}
