package com.Tirth_Electrical_Main.MainBackend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Enables @Async, used only by EmailServiceImpl. Email is explicitly an
 * "additional delivery layer" (Phase 3 spec) on top of the DB-persisted
 * notification, which is already durable by the time an email is even
 * attempted - so email sending runs on a background thread precisely so a
 * slow/unreachable SMTP server can never add latency to (or fail) the
 * request that triggered it (submitting/approving/rejecting a role
 * request). No custom executor bean is configured - Spring's default
 * SimpleAsyncTaskExecutor is sufficient for this app's email volume.
 */
@Configuration
@EnableAsync
public class AsyncConfig {
}
