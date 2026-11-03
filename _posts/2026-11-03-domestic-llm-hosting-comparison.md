---
title: "국내 LLM 자체 호스팅: 네이버클라우드·엘리스클라우드·VESSL 비교"
date: 2026-11-03 00:00:00 +0900
description: "공개 LLM을 직접 호스팅할 때 필요한 GPU 요금, 스토리지, 결제 방식과 초기 한도를 국내 3사 기준으로 비교한다."
categories: [AI, Cloud]
tags: [llm, gpu, cloud, naver-cloud, elice, vessl]
---

공개 가중치 LLM을 클라우드 GPU에서 실행하고, 로컬 PC에서 API로 호출하는 용도로 네이버클라우드·엘리스클라우드·VESSL을 비교한다.

> 작성·팩트체크 기준: **2026-11-03**. 월 예상액은 별도 표시가 없으면 30일(720시간) 상시 사용 기준이다.

## 1. 사용 방식

| 항목 | 네이버클라우드 GPU Server | 엘리스클라우드 ECI | VESSL Cloud Container Compute |
| --- | --- | --- | --- |
| 공개 가중치 직접 로드 | GPU 서버에서 직접 실행 | GPU VM에서 직접 실행 | GPU Workspace에서 직접 실행 |
| 로컬 PC에서 API 호출 | vLLM 등으로 API 서버 구성 | 공식 vLLM API 서빙 가이드 제공 | 사용자 컨테이너·외부 포트로 직접 API 구성 |
| 요금제 | **시간제·월 요금제**. 월 사용액을 익월 정산하며, 선불 코인으로도 결제 가능. 개인 GPU 이용은 사전 신청·선불 코인 필요 | **온디맨드·스팟은 초 단위 과금**, 약정형은 계약 요금 적용. 결제·청구 방식은 기관 유형·계약에 따라 결정 | **온디맨드는 초 단위 과금·선충전 크레딧 차감**. 전용 VM Cluster는 **기간 약정·별도 청구** |
| 안 쓸 때 컴퓨팅 요금 중단 | **정지만으로는 중단되지 않음. 서버 반납 필요** | 온디맨드·스팟 VM은 **Idle 상태**가 되면 중단. 약정형은 상태와 관계없이 계약 기간 과금 | Workspace **Pause**로 중단 |

직접 로드는 사용자가 모델을 설치·실행할 수 있다는 뜻이다. 모든 모델의 실행을 보장한다는 의미는 아니며, 모델별 라이선스·서빙 도구 호환성·필요 GPU 메모리를 확인해야 한다.

근거:

- **네이버:** GPU 서버를 직접 구성하며, 정지 중에도 서버 요금 발생. [공식 가이드](https://guide.ncloud-docs.com/docs/server-gpuserver-vpc-kvm)
- **엘리스:** vLLM으로 API 서빙 가능. 온디맨드 VM은 중지 완료 후 컴퓨팅 과금 중단. [서빙 가이드](https://help.elice.io/help/en/docs/eci/tutorials/llm-inference) · [과금 안내](https://help.elice.io/help/en/docs/eci/compute/vm-lifecycle)
- **VESSL:** 사용자 컨테이너·외부 포트 지원. Pause 시 컴퓨팅 과금을 중단하고 저장소 과금은 남을 수 있음. [생성 가이드](https://docs.cloud.vessl.ai/member/workspace/create) · [과금 안내](https://docs.cloud.vessl.ai/admin/billing/overview)

## 2. GPU 한 장 구성의 시간당 공개 요금

**네이버·엘리스는 원화·부가세 별도다. VESSL은 달러 공개 단가를 그대로 표기했다.** CPU·RAM·저장소 조건은 업체별로 다르므로 GPU 이름만으로 완전히 같은 상품이라고 볼 수 없다. 저장소·네트워크 등 부대비용은 별도 확인한다.

네이버 가격은 아래 CPU·RAM 표의 구성 기준이다. 같은 GPU 한 장이어도 CPU 사양이 다르면 가격이 달라진다. 엘리스는 일반존 기준이며, 공식 안내상 공공존은 일반 요금보다 10% 높다.

| GPU / 장당 메모리 | 네이버클라우드 | 엘리스 ECI 온디맨드 | VESSL 온디맨드 |
| --- | ---: | ---: | ---: |
| L4 24GB | **1,447원/시간** | 현재 공개표에 없음 | 현재 공개표에 없음 |
| L40S 48GB | **4,309원/시간** | 현재 공개표에 없음 | **$1.80/시간** |
| A100 80GB | 한 장 상품 가격 미표기·8장 구성 별도 | **2,500원/시간 (PCIe)** | **$1.77/시간 (SXM)** |
| H100 80GB | 한 장 상품 가격 미표기·8장 구성 별도 | **5,500원/시간 (SXM)** | **$3.57/시간 (SXM)** |

**위 가격은 GPU와 CPU·일반 RAM을 함께 제공하는 실행 환경의 요금이다.** CPU는 서버 프로그램을 실행하는 처리 자원이고, 일반 RAM은 프로그램·데이터 처리에 쓰는 메모리다. **GPU 전용 메모리(VRAM)와 일반 RAM은 별개**이며, CPU 개수와 GPU 장수도 구분해야 한다.

| 업체 / GPU 1장 구성 | GPU 전용 메모리 | CPU | 일반 RAM | 사양 출처 |
| --- | --- | --- | --- | --- |
| 네이버 L4 · `gp1l4-g3` | 24GB | 4 vCPU | 48GB | [네이버 GPU 요금표 · L4](https://www.ncloud.com/product/compute/gpuServer#pricing) |
| 네이버 L40S · `gp1ls16-g3` | 48GB | 16 vCPU | 96GB | [네이버 GPU 요금표 · L40S](https://www.ncloud.com/product/compute/gpuServer#pricing) |
| 엘리스 A100 PCIe | 80GB | 16 vCore | 192GiB | [엘리스 ECI · A100 사양](https://elice.io/ko/cloud/eci) |
| 엘리스 H100 SXM | 80GB | 24 vCore | 240GiB | [엘리스 ECI · H100 사양](https://elice.io/ko/cloud/eci) |
| VESSL | 선택한 GPU에 따라 결정 | 생성 화면에서 확인 | 생성 화면에서 확인 | [VESSL 생성 가이드 · Resource spec](https://docs.cloud.vessl.ai/member/workspace/create) |

출처: [네이버 GPU 가격](https://www.ncloud.com/product/compute/gpuServer#pricing), [엘리스 ECI 가격·과금 단위](https://elice.io/ko/cloud/eci), [엘리스 전체 요금표](https://elice.io/ko/cloud/pricing/eci), [VESSL 현재 요금표](https://vessl.ai/ko/pricing). 과거 블로그의 할인·프로모션 가격보다 조회 시점의 상품·요금표를 우선했다.

## 3. 월 요금제와 월간 비용 비교

**네이버클라우드:** 시간제·월 요금제. 월 요금으로 한 달 미만 이용하면 이용한 날짜 수에 맞춰 계산한다.

**엘리스:** On-Demand(사용 시간만큼 과금), Reserved(기간 약정·개별 견적).

**베슬:** 온디맨드(초 단위 과금), 예약형(기간 계약·개별 견적).

### GPU 한 장: 월 비용

**아래 월 비용에는 파일을 계속 보관하는 영구 스토리지 요금이 포함되지 않는다.** GPU 전용 메모리(VRAM)·일반 RAM과 모델 파일을 저장하는 디스크 공간은 서로 다른 자원이다.

**네이버는 공식 월 요금**, **엘리스·VESSL은 온디맨드 시간당 단가 × 720시간(30일 × 24시간)** 계산값이다. 아래 예상액을 예약형·약정형 월 견적으로 해석하면 안 된다. 30일 상시 사용 기준으로 비교했으며, 실제 사용 일수·가동 시간에 따라 달라진다.

| GPU | 네이버 공식 월 요금 | 엘리스 30일 상시 사용 예상액 | VESSL 30일 상시 사용 예상액 |
| --- | ---: | ---: | ---: |
| L4 24GB | **1,041,186원** | — | — |
| L40S 48GB | **3,102,080원** | — | **$1,296.00** |
| A100 80GB | 한 장 월 요금 미표기·8장 구성 별도 | **1,800,000원 · PCIe** | **$1,274.40 · SXM** |
| H100 80GB | 한 장 월 요금 미표기·8장 구성 별도 | **3,960,000원 · SXM** | **$2,570.40 · SXM** |

가격·계산 근거: [네이버 공식 요금](https://www.ncloud.com/product/compute/gpuServer#pricing), [엘리스 공식 단가](https://elice.io/ko/cloud/eci), [VESSL 공식 단가](https://vessl.ai/ko/pricing).

### 스토리지 포함 여부와 모델 보관

| 업체 | GPU 요금에 스토리지 포함? | 모델 파일을 저장할 공간 | 계속 보관하려면 | 출처 |
| --- | --- | --- | --- | --- |
| 네이버 L4·L40S | **기본 디스크부터 별도 과금** | 운영체제·프로그램·모델 파일용 디스크 | 서버 반납 전 이미지 또는 외부 저장소에 보관. 이미지·스냅샷도 별도 과금 | [디스크 과금](https://www.ncloud.com/product/compute/gpuServer#pricing) · [서버 이미지](https://guide.ncloud-docs.com/docs/server-serverimage-vpc) |
| 엘리스 ECI | **블록 스토리지 별도 과금** | 운영체제·모델 파일용 블록 스토리지. H100 등은 임시 NVMe 캐시도 제공 | 디스크를 유지하면 파일 보관 가능. 저장소 요금은 계속 발생. 임시 캐시는 재부팅 시 초기화 | [과금](https://help.elice.io/help/docs/eci/billing/pricing-model) · [디스크 보관](https://help.elice.io/help/docs/eci/storage/block-storage) · [임시 캐시](https://help.elice.io/help/docs/eci/faq/faq-vm) |
| 베슬 Workspace | **임시 공간 포함·영구 저장소 별도 과금** | 포함된 임시 공간 또는 별도 영구 저장소 | 임시 공간은 중지 시 삭제. 계속 보관할 모델은 영구 저장소에 저장 | [저장소 구분](https://docs.cloud.vessl.ai/member/workspace/create) · [요금](https://vessl.ai/ko/pricing) |

**스토리지가 따로 필요한가?** 모델 파일을 둘 공간은 필요하다. 네이버·엘리스는 기본 디스크에 충분한 여유가 있으면 모델 전용 디스크를 추가할 필요는 없다. 베슬은 임시 공간의 용량이 충분하면 그곳에 모델을 내려받아 실행할 수 있지만, 중지 후에는 다시 다운로드해야 한다. 원본 데이터 파일은 로컬 PC에 보관할 수 있지만, API 요청에 넣은 텍스트·파일 내용은 클라우드 서버로 전송된다.

### 여러 장: 월 총비용

네이버는 공개된 월 요금을 그대로 기재했다. 엘리스는 공개된 다중 GPU 인스턴스 시간당 가격 × 720시간, VESSL은 장당 시간 단가 × 장수 × 720시간으로 계산했다. 예상액에는 예약 할인·부대비용을 적용하지 않았다. VESSL 다중 GPU 금액은 단순 환산값이며, 선택한 리전·장수의 실제 가격과 가용성은 생성 화면에서 확인한다.

| 업체 / GPU | 1장 | 2장 | 4장 | 8장 |
| --- | ---: | ---: | ---: | ---: |
| 네이버 L4 · 공식 월 요금 | 1,041,186원 | 2,082,371원 | 3,398,644원 | — |
| 네이버 L40S · 공식 월 요금 | 3,102,080원 | 6,204,161원 | 11,808,264원 | — |
| 엘리스 A100 · 30일 예상 | 1,800,000원 | 3,600,000원 | 7,200,000원 | — |
| 엘리스 H100 · 30일 예상 | 3,960,000원 | 7,920,000원 | 15,840,000원 | 31,680,000원 |
| VESSL A100 · 30일 예상 | $1,274.40 | $2,548.80 | $5,097.60 | $10,195.20 |
| VESSL H100 · 30일 예상 | $2,570.40 | $5,140.80 | $10,281.60 | $20,563.20 |
| VESSL L40S · 30일 예상 | $1,296.00 | $2,592.00 | $5,184.00 | $10,368.00 |

## 4. 실제 결제: 월 후불인가, 선불 크레딧인가

**네이버클라우드:** 월 사용액을 다음 달 10~14일 정기 결제. 선불 코인을 먼저 적용할 수 있지만, 코인보다 많이 쓰면 초과액은 후불 청구된다. [결제 안내](https://www.ncloud.com/charge/price) · [코인·초과액 처리](https://www.ncloud.com/support/faq/all/1884)

**엘리스:** AI클라우드는 크레딧 선충전 후 차감. ECI 온디맨드는 선사용 후 사용량만큼 청구하며, 구체적인 결제 수단·주기는 기관·계약별로 확인한다. [크레딧](https://help.elice.io/help/docs/elicecloud/introduction/) · [ECI 요금제](https://elice.io/ko/cloud/pricing/eci) · [ECI 결제](https://help.elice.io/help/docs/eci/billing/payment-methods)

**베슬:** Workspace는 선불 크레딧 차감(1크레딧＝1달러). 전용 VM Cluster는 별도 계약·청구. [크레딧](https://docs.cloud.vessl.ai/admin/billing/overview) · [전용 계약](https://docs.cloud.vessl.ai/vm-clusters/faq)

### 선충전 한도·신규 GPU 제한

| 업체 | 충전 금액 기준 | GPU 사용 제한 | 공식 출처 |
| --- | --- | --- | --- |
| 네이버클라우드 | 회당 최소 **1만 원**, 온라인 보유 잔액 최대 **1,000만 원**. 초과 구매는 문의 | 개인 회원은 사전 신청·선결제 필요. 필요 금액은 담당자 안내 | [충전 한도](https://www.ncloud.com/support/faq/all/1908) · [개인 GPU](https://www.ncloud.com/support/faq/all/37) |
| 엘리스 | 초기·최대 충전 한도 **공개 수치 미확인**. 화면 충전 옵션 초과 시 문의 | ECI는 조직별 쿼터 적용. 추가 할당량은 문의 | [충전](https://help.elice.io/help/docs/elicecloud/introduction/) · [GPU 쿼터](https://help.elice.io/help/docs/eci/faq/faq-vm) |
| 베슬 | 초기·최대 충전 한도 **공개 수치 미확인** | 온디맨드는 사전 쿼터 신청 불필요. Workspace 한 노드당 최대 **8장**. 실제 할당은 재고에 따라 대기 가능 | [요금·쿼터](https://vessl.ai/ko/pricing) · [장수 제한](https://vessl.ai/ko/cloud) · [가용성](https://docs.cloud.vessl.ai/member/workspace/create) |

충전 한도·GPU 할당량·실제 재고는 서로 다르다. 위 코인 보유 한도는 월 지출 한도가 아니며, 사용 이력에 따라 한도가 자동으로 늘어나는 공통 규칙은 3사 공식 자료에서 확인하지 못했다.

## 5. 팩트체크 (2026-11-03)

공식 요금표·사용 가이드·FAQ를 대조하고 월 환산액을 검산했다. **유료 GPU를 실제 임대해 모델 실행·성능·최종 청구액을 측정한 결과는 아니다.** 공개 자료로 확인하지 못한 항목은 미확인으로 남겼다.

| 검증 항목 | 판정 | 확인 결과·근거 |
| --- | --- | --- |
| 네이버 L4·L40S 단가 | 확인 | 본문의 시간·월 요금과 CPU·RAM은 공식 표와 일치. 한 장 가격은 `gp1l4-g3`·`gp1ls16-g3` 기준. [공식 요금표](https://www.ncloud.com/product/compute/gpuServer#pricing) |
| 엘리스 A100·H100 단가 | 확인 | 일반존 온디맨드 2,500원·5,500원/시간, 초 단위 과금·VAT 별도. 공공존 10% 상향 조건을 본문에 추가. [공식 상품·요금](https://elice.io/ko/cloud/eci) |
| VESSL L40S·A100·H100 단가 | 확인 | 각각 $1.80·$1.77·$3.57/시간. 본문은 온디맨드 Container Compute 기준. 전용 VM Cluster는 별도 견적. [공식 요금표](https://vessl.ai/ko/pricing) |
| 월 비용·여러 장 비용 | 계산값 구분 | 네이버 월 요금은 공식 금액. 엘리스·VESSL은 720시간 환산으로 계산 일치. VESSL 공식 계산기 기본값은 730시간이라 표시액이 다를 수 있음. 약정 견적·재고 보장이 아님. [네이버](https://www.ncloud.com/product/compute/gpuServer#pricing) · [엘리스](https://elice.io/ko/cloud/pricing/eci) · [VESSL](https://vessl.ai/ko/pricing) |
| 중지하면 무료인가 | 조건 보완 | 네이버 GPU는 정지 중에도 전체 서버 요금 발생. 엘리스 온디맨드·스팟은 Idle에서 컴퓨팅 과금 중단하나 약정형은 계약 기간 과금. VESSL Pause는 저장소 비용이 남을 수 있음. [네이버](https://guide.ncloud-docs.com/docs/server-gpuserver-vpc-kvm) · [엘리스](https://help.elice.io/help/en/docs/eci/compute/vm-lifecycle) · [VESSL](https://docs.cloud.vessl.ai/member/workspace/cleanup) |
| 스토리지 포함·모델 재사용 | 조건 보완 | 네이버 L4·L40S 디스크와 엘리스 블록 스토리지는 별도 요금. VESSL 포함 임시 공간은 중지 시 사라짐. 영구 보관 자원은 컴퓨팅 중지 후에도 과금될 수 있음. [네이버](https://www.ncloud.com/product/compute/gpuServer#pricing) · [엘리스](https://help.elice.io/help/docs/eci/storage/block-storage) · [VESSL](https://docs.cloud.vessl.ai/member/workspace/create) |
| 엘리스·VESSL 결제 방식 | 상품별 구분 | 엘리스 AI클라우드의 선불 크레딧을 ECI 전체에 적용할 수 없음. ECI는 기관·계약별 결제. VESSL Workspace 크레딧은 전용 VM Cluster 결제에 사용할 수 없음. [AI클라우드](https://help.elice.io/help/docs/elicecloud/introduction/) · [ECI](https://help.elice.io/help/docs/eci/billing/payment-methods) · [VM Cluster](https://docs.cloud.vessl.ai/vm-clusters/faq) |
| 네이버 선충전 한도 | 의미 보완 | 회당 최소 1만 원·온라인 보유 최대 1,000만 원은 충전 기준. 코인 초과 사용액은 후불이므로 지출 상한이 아님. [충전 한도](https://www.ncloud.com/support/faq/all/1908) · [초과액 처리](https://www.ncloud.com/support/faq/all/1884) |
| 신규 계정 GPU 사용 | 조건 보완 | 네이버 개인은 신청·선결제, 엘리스 ECI는 할당량 확인 필요. VESSL 사전 쿼터 신청 불필요 안내도 즉시 재고 확보를 보장하지 않음. [네이버](https://www.ncloud.com/support/faq/all/37) · [엘리스](https://help.elice.io/help/docs/eci/faq/faq-vm) · [VESSL](https://docs.cloud.vessl.ai/member/workspace/create) |
| 공개 가중치 직접 로드 | 조건부 | GPU 서버·사용자 실행 환경에서 직접 서빙하는 경로는 확인. 모델별 라이선스·호환성·메모리는 따로 확인해야 함. 엘리스는 vLLM과 Llama 예시를 명시. [네이버 환경](https://guide.ncloud-docs.com/docs/server-gpuserver-vpc-kvm) · [엘리스 서빙](https://help.elice.io/help/en/docs/eci/tutorials/llm-inference) · [VESSL 환경](https://docs.cloud.vessl.ai/member/workspace/create) |
| 데이터는 PC에만 남는가 | 설명 수정 | 원본 파일을 PC에 보관해도 API 요청에 담은 내용은 서버로 전달됨. 로컬 파일 보관과 클라우드 전송은 구분해야 함. [API 요청 예시](https://help.elice.io/help/en/docs/eci/tutorials/llm-inference) |
| 미공개 한도·자동 증액 | 미확인 | 엘리스·VESSL의 공통 신규 충전 금액 상한, 3사의 사용 이력별 자동 한도 증액 규칙은 공개 자료에서 확인하지 못함. 한도가 없거나 AWS와 같다고 단정할 근거는 없음. [엘리스 결제](https://help.elice.io/help/docs/eci/billing/payment-methods) · [VESSL 결제](https://docs.cloud.vessl.ai/admin/billing/overview) |
