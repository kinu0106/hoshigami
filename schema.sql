--
-- PostgreSQL database dump
--

\restrict CxAgMVqSv1L5Ry8JdUTBjXaILdDvePf52jbt8bLN1mIE0T5RbGwjxPC7PNwv5RN

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-11-21 11:13:26

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 25662)
-- Name: achievements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.achievements (
    id integer NOT NULL,
    input_date date NOT NULL,
    employee_id integer NOT NULL,
    department_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    shipment_date date,
    remark text
);


ALTER TABLE public.achievements OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 25661)
-- Name: achievements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.achievements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.achievements_id_seq OWNER TO postgres;

--
-- TOC entry 4948 (class 0 OID 0)
-- Dependencies: 221
-- Name: achievements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.achievements_id_seq OWNED BY public.achievements.id;


--
-- TOC entry 218 (class 1259 OID 25629)
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    name character varying(255) NOT NULL
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 25628)
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO postgres;

--
-- TOC entry 4949 (class 0 OID 0)
-- Dependencies: 217
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- TOC entry 220 (class 1259 OID 25638)
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 25637)
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employees_id_seq OWNER TO postgres;

--
-- TOC entry 4950 (class 0 OID 0)
-- Dependencies: 219
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- TOC entry 226 (class 1259 OID 25843)
-- Name: invoice_numbers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoice_numbers (
    id integer NOT NULL,
    current_number integer DEFAULT 1 NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.invoice_numbers OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 25842)
-- Name: invoice_numbers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoice_numbers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoice_numbers_id_seq OWNER TO postgres;

--
-- TOC entry 4951 (class 0 OID 0)
-- Dependencies: 225
-- Name: invoice_numbers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invoice_numbers_id_seq OWNED BY public.invoice_numbers.id;


--
-- TOC entry 223 (class 1259 OID 25817)
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 25818)
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer DEFAULT nextval('public.products_id_seq'::regclass) NOT NULL,
    name character varying(255) NOT NULL,
    unit character varying(10) NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    department_id integer NOT NULL,
    is_active boolean DEFAULT true
);


ALTER TABLE public.products OWNER TO postgres;

--
-- TOC entry 4765 (class 2604 OID 25665)
-- Name: achievements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.achievements ALTER COLUMN id SET DEFAULT nextval('public.achievements_id_seq'::regclass);


--
-- TOC entry 4762 (class 2604 OID 25632)
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- TOC entry 4763 (class 2604 OID 25641)
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- TOC entry 4770 (class 2604 OID 25846)
-- Name: invoice_numbers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_numbers ALTER COLUMN id SET DEFAULT nextval('public.invoice_numbers_id_seq'::regclass);


--
-- TOC entry 4783 (class 2606 OID 25669)
-- Name: achievements achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_pkey PRIMARY KEY (id);


--
-- TOC entry 4774 (class 2606 OID 25636)
-- Name: departments departments_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_name_key UNIQUE (name);


--
-- TOC entry 4776 (class 2606 OID 25634)
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- TOC entry 4778 (class 2606 OID 25645)
-- Name: employees employees_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_name_key UNIQUE (name);


--
-- TOC entry 4780 (class 2606 OID 25643)
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- TOC entry 4794 (class 2606 OID 25850)
-- Name: invoice_numbers invoice_numbers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoice_numbers
    ADD CONSTRAINT invoice_numbers_pkey PRIMARY KEY (id);


--
-- TOC entry 4790 (class 2606 OID 25824)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 4792 (class 2606 OID 25826)
-- Name: products uk_products_dept_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT uk_products_dept_name UNIQUE (department_id, name);


--
-- TOC entry 4784 (class 1259 OID 25686)
-- Name: idx_achievements_dept; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_achievements_dept ON public.achievements USING btree (department_id);


--
-- TOC entry 4785 (class 1259 OID 25685)
-- Name: idx_achievements_input_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_achievements_input_date ON public.achievements USING btree (input_date);


--
-- TOC entry 4786 (class 1259 OID 25687)
-- Name: idx_achievements_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_achievements_product ON public.achievements USING btree (product_id);


--
-- TOC entry 4787 (class 1259 OID 25688)
-- Name: idx_achievements_shipment_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_achievements_shipment_date ON public.achievements USING btree (shipment_date);


--
-- TOC entry 4781 (class 1259 OID 25690)
-- Name: idx_employees_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employees_is_active ON public.employees USING btree (is_active);


--
-- TOC entry 4788 (class 1259 OID 25832)
-- Name: idx_products_department_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_department_id ON public.products USING btree (department_id);


--
-- TOC entry 4795 (class 2606 OID 25675)
-- Name: achievements achievements_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4796 (class 2606 OID 25670)
-- Name: achievements achievements_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 4797 (class 2606 OID 25827)
-- Name: products products_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


-- Completed on 2025-11-21 11:13:26

--
-- PostgreSQL database dump complete
--

\unrestrict CxAgMVqSv1L5Ry8JdUTBjXaILdDvePf52jbt8bLN1mIE0T5RbGwjxPC7PNwv5RN

