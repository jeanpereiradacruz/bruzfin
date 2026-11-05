package com.bruzfin.archfixture.domain;

import com.bruzfin.archfixture.adapter.out.persistence.SampleEntity;
import com.bruzfin.archfixture.application.SampleService;

/** Violação proposital: domínio usando Spring, aplicação e adapter. */
@org.springframework.stereotype.Component
public class SpringInDomain {
    SampleService service;
    SampleEntity entity;
}
