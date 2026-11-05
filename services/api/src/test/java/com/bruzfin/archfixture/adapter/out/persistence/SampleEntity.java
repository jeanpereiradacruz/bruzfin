package com.bruzfin.archfixture.adapter.out.persistence;

import com.bruzfin.archfixture.adapter.in.web.SampleController;

/** Violação proposital: adapter de saída usando adapter de entrada. */
public class SampleEntity {
    SampleController controller;
}
