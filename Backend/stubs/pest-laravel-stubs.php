<?php

// Stubs pour l'analyse statique (VS Code / Intelephense).
// Ce fichier n'est pas autoloadé en production.

namespace Pest\Laravel {
    /** @return void */
    function seed($class = [], array $parameters = []) {}

    /** @return void */
    function actingAs($user, $driver = null) {}

    /** @return mixed */
    function from(string $url) {}

    /** @return void */
    function assertGuest($guard = null) {}

    /** @internal */
    function __stubResponse(): \Illuminate\Testing\TestResponse
    {
        return new \Illuminate\Testing\TestResponse(
            new \Symfony\Component\HttpFoundation\Response(),
        );
    }

    /** @return \Illuminate\Testing\TestResponse */
    function get(string $uri, array $headers = []) { return __stubResponse(); }

    /** @return \Illuminate\Testing\TestResponse */
    function post(string $uri, array $data = [], array $headers = []) { return __stubResponse(); }

    /** @return \Illuminate\Testing\TestResponse */
    function patch(string $uri, array $data = [], array $headers = []) { return __stubResponse(); }

    /** @return \Illuminate\Testing\TestResponse */
    function delete(string $uri, array $data = [], array $headers = []) { return __stubResponse(); }
}
