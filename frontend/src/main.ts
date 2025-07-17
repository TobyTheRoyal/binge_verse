import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app/app-routing.module';
import { provideAnimations } from '@angular/platform-browser/animations'; // Falls Animationen genutzt werden
import { importProvidersFrom } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
// src/main.ts
// @ts-expect-error: Typen nicht auflösbar bei swiper v9
import { register } from 'swiper/element/bundle';
register();

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(), // Optional, falls du Material nutzt
    importProvidersFrom(ReactiveFormsModule, FormsModule), // Für FormBuilder
  ],
})
.catch(err => console.error(err));