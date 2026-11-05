package com.bruzfin.archfixture.application;

import com.bruzfin.archfixture.adapter.out.persistence.SampleEntity;

/** Violação proposital: aplicação usando Spring Web e um adapter. */
@org.springframework.stereotype.Service
public class SampleService {
    SampleEntity entity;
    org.springframework.web.client.RestClient client;
}
