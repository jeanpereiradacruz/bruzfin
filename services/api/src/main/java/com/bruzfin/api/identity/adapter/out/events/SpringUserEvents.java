package com.bruzfin.api.identity.adapter.out.events;

import com.bruzfin.api.identity.UserProvisioned;
import com.bruzfin.api.identity.application.port.out.UserEvents;
import com.bruzfin.api.identity.domain.User;
import org.jmolecules.architecture.hexagonal.SecondaryAdapter;
import org.springframework.context.ApplicationEventPublisher;

/** Publica no barramento do Spring; o Modulith grava cada publicação na tabela event_publication. */
@SecondaryAdapter
public final class SpringUserEvents implements UserEvents {

    private final ApplicationEventPublisher publisher;

    public SpringUserEvents(ApplicationEventPublisher publisher) {
        this.publisher = publisher;
    }

    @Override
    public void provisioned(User user) {
        publisher.publishEvent(new UserProvisioned(user.id().value(), user.displayName()));
    }
}
